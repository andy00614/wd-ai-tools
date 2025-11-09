"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
	knowledgeSessions,
	outlines,
	questions,
} from "../schemas/knowledge.schema";
import { requireAuth } from "@/modules/auth/utils/auth-utils";

export async function getSessionDetail(sessionId: string) {
	try {
		const user = await requireAuth();
		const db = await getDb();

		// Get session
		const [session] = await db
			.select()
			.from(knowledgeSessions)
			.where(eq(knowledgeSessions.id, sessionId));

		if (!session) {
			return { success: false, error: "Session not found" };
		}

		// Check ownership
		if (session.userId !== user.id) {
			return { success: false, error: "Unauthorized" };
		}

		// Get outlines
		const sessionOutlines = await db
			.select()
			.from(outlines)
			.where(eq(outlines.sessionId, sessionId))
			.orderBy(outlines.orderIndex);

		// Get questions for each outline
		const outlinesWithQuestions = await Promise.all(
			sessionOutlines.map(async (outline) => {
				const outlineQuestions = await db
					.select()
					.from(questions)
					.where(eq(questions.outlineId, outline.id));

				return {
					...outline,
					questions: outlineQuestions.map((q) => ({
						...q,
						options: JSON.parse(q.options) as string[],
					})),
				};
			}),
		);

		return {
			success: true,
			data: {
				session,
				outlines: outlinesWithQuestions,
			},
		};
	} catch (error) {
		console.error("Failed to get session detail:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
