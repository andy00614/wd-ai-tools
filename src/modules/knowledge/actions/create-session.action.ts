"use server";

import { getDb } from "@/db";
import { knowledgeSessions } from "../schemas/knowledge.schema";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import {
    createSessionSchema,
    type CreateSessionInput,
} from "../models/knowledge.model";

export async function createSession(input: CreateSessionInput) {
    try {
        // 1. Authenticate
        const user = await requireAuth();

        // 2. Validate input
        const validated = createSessionSchema.parse(input);

        // 3. Database operation
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

        // 4. Return typed response
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
