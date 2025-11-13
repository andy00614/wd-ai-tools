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
import { calculateCost } from "@/lib/pricing";

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

        console.log(
            `[Token Debug] Starting question generation for session ${sessionId}`,
        );
        console.log(
            `[Token Debug] Initial tokens - Input: ${session.inputToken || 0}, Output: ${session.outputToken || 0}`,
        );

        const sessionOutlines = await db
            .select()
            .from(outlines)
            .where(eq(outlines.sessionId, sessionId))
            .orderBy(outlines.orderIndex);

        console.log(
            `[Token Debug] Found ${sessionOutlines.length} outlines to generate questions for`,
        );

        // 2. Create AI Gateway instance
        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });

        // 3. Track total tokens and cost for all question generation
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCost = 0;

        // 3. Generate questions for all outlines in parallel
        const questionPromises = sessionOutlines.map(async (outline) => {
            await db
                .update(outlines)
                .set({ status: "generating" })
                .where(eq(outlines.id, outline.id));

            try {
                console.log(
                    `[Token Debug] Generating questions for outline: "${outline.title}"`,
                );

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

                // Get usage for this outline
                const usage = await result.usage;
                console.log(
                    `[Token Debug] Outline "${outline.title}" - Input: ${usage.inputTokens}, Output: ${usage.outputTokens}`,
                );
                console.log(
                    `[Cost Debug] Full usage object for outline "${outline.title}":`,
                    JSON.stringify(usage, null, 2),
                );

                // Calculate cost for this outline
                const outlineCost = await calculateCost(
                    session.model,
                    usage.inputTokens ?? 0,
                    usage.outputTokens ?? 0,
                );

                if (outlineCost !== null) {
                    console.log(
                        `[Cost Debug] Cost for outline "${outline.title}": $${outlineCost.toFixed(6)}`,
                    );
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

                return {
                    success: true,
                    outlineId: outline.id,
                    inputTokens: usage.inputTokens,
                    outputTokens: usage.outputTokens,
                    cost: outlineCost || 0,
                };
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

        const results = await Promise.all(questionPromises);

        // Sum up all tokens and cost from question generation
        for (const result of results) {
            totalInputTokens += result.inputTokens || 0;
            totalOutputTokens += result.outputTokens || 0;
            totalCost += result.cost || 0;
        }

        console.log(
            `[Token Debug] Question generation totals - Input: ${totalInputTokens}, Output: ${totalOutputTokens}`,
        );
        console.log(
            `[Cost Debug] Question generation total cost: $${totalCost.toFixed(6)}`,
        );

        // 4. Update session to completed with cumulative tokens and cost
        const totalTime = Date.now() - startTime;
        const cumulativeInputTokens =
            (session.inputToken || 0) + totalInputTokens;
        const cumulativeOutputTokens =
            (session.outputToken || 0) + totalOutputTokens;

        // Calculate cumulative cost
        const previousCost = session.cost ? Number.parseFloat(session.cost) : 0;
        const cumulativeCost = previousCost + totalCost;

        console.log(
            `[Token Debug] Final cumulative tokens - Input: ${cumulativeInputTokens}, Output: ${cumulativeOutputTokens}`,
        );
        console.log(
            `[Cost Debug] Final cumulative cost: $${cumulativeCost.toFixed(6)} (previous: $${previousCost.toFixed(6)}, added: $${totalCost.toFixed(6)})`,
        );

        await db
            .update(knowledgeSessions)
            .set({
                status: "completed",
                timeConsume: session.timeConsume
                    ? session.timeConsume + totalTime
                    : totalTime,
                inputToken: cumulativeInputTokens,
                outputToken: cumulativeOutputTokens,
                cost: cumulativeCost.toString(),
            })
            .where(eq(knowledgeSessions.id, sessionId));

        console.log(
            `[Token Debug] Session ${sessionId} completed successfully`,
        );

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
