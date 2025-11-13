"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, streamObject } from "ai";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { knowledgeSessions, outlines } from "../schemas/knowledge.schema";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import {
    createSessionSchema,
    outlinesResponseSchema,
    type CreateSessionInput,
} from "../models/knowledge.model";
import { calculateCost } from "@/lib/pricing";

// Default prompt for outline generation
const OUTLINE_GENERATION_PROMPT = `You are an educational content expert. Generate a structured outline for the knowledge point: "{knowledge_point}".

Requirements:
- Create 3-5 main topics
- Each topic should be clear and focused
- Topics should build on each other logically

Return as JSON in the following format: {"outlines": [{"title": "Topic 1"}, {"title": "Topic 2"}, ...]}`;

export async function createSessionAndGenerateOutline(
    input: CreateSessionInput,
) {
    const user = await requireAuth();
    const validated = createSessionSchema.parse(input);
    const db = await getDb();
    const { env } = await getCloudflareContext();
    const startTime = Date.now();

    console.log("[createSessionAndGenerateOutline] Received input:");
    console.log("- title:", validated.title);
    console.log("- model:", validated.model);
    console.log("- outlinePrompt:", validated.outlinePrompt);

    // 1. Create session
    const [session] = await db
        .insert(knowledgeSessions)
        .values({
            title: validated.title,
            model: validated.model,
            status: "generating_outline",
            userId: user.id,
        })
        .returning();

    try {
        // 2. Create AI Gateway instance with API key from env
        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });

        // 3. Determine which prompt to use
        const promptToUse = validated.outlinePrompt
            ? validated.outlinePrompt
            : OUTLINE_GENERATION_PROMPT.replace(
                  "{knowledge_point}",
                  validated.title,
              );

        console.log(
            "[createSessionAndGenerateOutline] Using prompt:",
            promptToUse,
        );
        console.log(
            "[createSessionAndGenerateOutline] Calling AI with model:",
            validated.model,
        );

        // 4. Generate outline using AI Gateway
        const result = streamObject({
            model: gateway(validated.model), // e.g., "openai/gpt-4o"
            schema: outlinesResponseSchema,
            prompt: promptToUse,
        });

        // 3. Collect streamed data
        let outlineData: Array<{ title: string }> = [];
        for await (const partialObject of result.partialObjectStream) {
            if (partialObject.outlines) {
                outlineData = partialObject.outlines as Array<{
                    title: string;
                }>;
            }
        }

        // 4. Save outlines to database
        const savedOutlines = await Promise.all(
            outlineData.map((item, index) =>
                db
                    .insert(outlines)
                    .values({
                        sessionId: session.id,
                        title: item.title,
                        orderIndex: index + 1,
                        status: "pending",
                    })
                    .returning(),
            ),
        );

        // 5. Update session status
        const timeConsume = Date.now() - startTime;
        const usage = await result.usage;

        console.log(
            `[Token Debug] Outline generation completed for session ${session.id}`,
        );
        console.log(
            `[Token Debug] Outline tokens - Input: ${usage.inputTokens}, Output: ${usage.outputTokens}`,
        );
        console.log(`[Token Debug] Time consumed: ${timeConsume}ms`);
        console.log(
            `[Cost Debug] Full usage object:`,
            JSON.stringify(usage, null, 2),
        );

        // Calculate cost
        const cost = await calculateCost(
            session.model,
            usage.inputTokens ?? 0,
            usage.outputTokens ?? 0,
        );

        if (cost !== null) {
            console.log(
                `[Cost Debug] Outline generation cost: $${cost.toFixed(6)}`,
            );
        }

        await db
            .update(knowledgeSessions)
            .set({
                status: "generating_questions",
                timeConsume,
                inputToken: usage.inputTokens,
                outputToken: usage.outputTokens,
                cost: cost !== null ? cost.toString() : null,
            })
            .where(eq(knowledgeSessions.id, session.id));

        return {
            success: true,
            sessionId: session.id,
            outlines: savedOutlines.flat(),
        };
    } catch (error) {
        console.error("Failed to generate outline:", error);

        await db
            .update(knowledgeSessions)
            .set({
                status: "failed",
                errorMsg:
                    error instanceof Error ? error.message : "Unknown error",
            })
            .where(eq(knowledgeSessions.id, session.id));

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// Keep the simple create session for backward compatibility
export async function createSession(input: CreateSessionInput) {
    try {
        const user = await requireAuth();
        const validated = createSessionSchema.parse(input);
        const db = await getDb();

        const [newSession] = await db
            .insert(knowledgeSessions)
            .values({
                title: validated.title,
                model: validated.model,
                status: "pending",
                userId: user.id,
            })
            .returning();

        return {
            success: true,
            data: newSession,
        };
    } catch (error) {
        console.error("Failed to create session:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
