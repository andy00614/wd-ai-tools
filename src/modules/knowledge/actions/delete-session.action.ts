"use server";

import { getDb } from "@/db";
import { knowledgeSessions } from "../schemas/knowledge.schema";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteSession(sessionId: string) {
    try {
        const user = await requireAuth();
        const db = await getDb();

        // Delete session (cascade will handle related records)
        const result = await db
            .delete(knowledgeSessions)
            .where(
                and(
                    eq(knowledgeSessions.id, sessionId),
                    eq(knowledgeSessions.userId, user.id),
                ),
            )
            .returning();

        if (result.length === 0) {
            return {
                success: false,
                error: "Session not found or unauthorized",
            };
        }

        // Revalidate the knowledge page
        revalidatePath("/dashboard/knowledge");

        return { success: true };
    } catch (error) {
        console.error("Failed to delete session:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
