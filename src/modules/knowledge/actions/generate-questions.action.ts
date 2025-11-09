"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, streamObject } from "ai";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
    questions,
    outlines,
    knowledgeSessions,
} from "../schemas/knowledge.schema";
import { questionsResponseSchema } from "../models/knowledge.model";

// Default prompt for question generation
const QUESTION_GENERATION_PROMPT = `Generate 5 multiple-choice questions about: "{outline_title}".

Requirements:
- Each question has exactly 4 options (A, B, C, D)
- Include one correct answer
- Provide explanation for the correct answer
- Questions should test understanding, not just memorization

Return as JSON: {"questions": [{"content": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "..."}]}`;

export async function generateQuestionsForSession(sessionId: string) {
    const db = await getDb();
    const { env } = await getCloudflareContext();
    const startTime = Date.now();

    try {
        // 1. Get session and outlines
        const [session] = await db
            .select()
            .from(knowledgeSessions)
            .where(eq(knowledgeSessions.id, sessionId));

        if (!session) {
            return { success: false, error: "Session not found" };
        }

        const sessionOutlines = await db
            .select()
            .from(outlines)
            .where(eq(outlines.sessionId, sessionId))
            .orderBy(outlines.orderIndex);

        // 2. Create AI Gateway instance
        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });

        // 3. Generate questions for all outlines in parallel
        const questionPromises = sessionOutlines.map(async (outline) => {
            await db
                .update(outlines)
                .set({ status: "generating" })
                .where(eq(outlines.id, outline.id));

            try {
                const result = streamObject({
                    model: gateway(session.model),
                    schema: questionsResponseSchema,
                    prompt: QUESTION_GENERATION_PROMPT.replace(
                        "{outline_title}",
                        outline.title,
                    ),
                });

                // Collect streamed questions
                let questionData: Array<{
                    content: string;
                    options: string[];
                    answer: string;
                    explanation?: string;
                }> = [];

                for await (const partialObject of result.partialObjectStream) {
                    if (partialObject.questions) {
                        questionData =
                            partialObject.questions as typeof questionData;
                    }
                }

                // Save questions
                await Promise.all(
                    questionData.map((q) =>
                        db.insert(questions).values({
                            sessionId,
                            outlineId: outline.id,
                            content: q.content,
                            type: "multiple_choice",
                            options: JSON.stringify(q.options),
                            answer: q.answer,
                            explanation: q.explanation,
                        }),
                    ),
                );

                await db
                    .update(outlines)
                    .set({ status: "completed" })
                    .where(eq(outlines.id, outline.id));

                return { success: true, outlineId: outline.id };
            } catch (error) {
                console.error(
                    `Failed to generate questions for outline ${outline.id}:`,
                    error,
                );

                await db
                    .update(outlines)
                    .set({ status: "failed" })
                    .where(eq(outlines.id, outline.id));

                throw error;
            }
        });

        await Promise.all(questionPromises);

        // 3. Update session to completed
        const totalTime = Date.now() - startTime;
        await db
            .update(knowledgeSessions)
            .set({
                status: "completed",
                timeConsume: session.timeConsume
                    ? session.timeConsume + totalTime
                    : totalTime,
            })
            .where(eq(knowledgeSessions.id, sessionId));

        return { success: true };
    } catch (error) {
        console.error("Failed to generate questions:", error);

        await db
            .update(knowledgeSessions)
            .set({
                status: "failed",
                errorMsg:
                    error instanceof Error
                        ? error.message
                        : "Question generation failed",
            })
            .where(eq(knowledgeSessions.id, sessionId));

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
