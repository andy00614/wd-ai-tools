"use server";

import { getDb } from "@/db";
import { knowledgeSessions } from "../schemas/knowledge.schema";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import { eq, desc, and, like } from "drizzle-orm";
import type { SessionFilters } from "../models/knowledge.model";

export async function getSessions(filters?: SessionFilters) {
    try {
        const user = await requireAuth();
        const db = await getDb();

        const conditions = [eq(knowledgeSessions.userId, user.id)];

        if (filters?.search) {
            conditions.push(
                like(knowledgeSessions.title, `%${filters.search}%`),
            );
        }

        if (filters?.model) {
            conditions.push(eq(knowledgeSessions.model, filters.model));
        }

        if (filters?.status) {
            conditions.push(eq(knowledgeSessions.status, filters.status));
        }

        const sessions = await db
            .select()
            .from(knowledgeSessions)
            .where(and(...conditions))
            .orderBy(desc(knowledgeSessions.createdAt));

        return { success: true, data: sessions };
    } catch (error) {
        console.error("Failed to get sessions:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            data: [],
        };
    }
}
