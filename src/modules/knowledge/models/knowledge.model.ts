import { z } from "zod";
import {
    knowledgeSessions,
    outlines,
    questions,
} from "../schemas/knowledge.schema";

// Session Creation
export const createSessionSchema = z.object({
    title: z
        .string()
        .min(1, "Knowledge point is required")
        .max(200, "Knowledge point is too long"),
    model: z.enum([
        "openai/gpt-4o",
        "anthropic/claude-sonnet-4",
        "google/gemini-2.0-flash-exp",
    ]),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// Outline Structure (from LLM)
export const outlineItemSchema = z.object({
    title: z.string(),
    order: z.number().optional(), // Optional, we can assign order ourselves
});

export const outlinesResponseSchema = z.object({
    outlines: z.array(outlineItemSchema),
});

// Question Structure (from LLM)
export const questionItemSchema = z.object({
    content: z.string(),
    options: z.array(z.string()).length(4), // Must have 4 options
    answer: z.enum(["A", "B", "C", "D"]),
    explanation: z.string().optional(),
});

export const questionsResponseSchema = z.object({
    questions: z.array(questionItemSchema),
});

// Filters
export const sessionFiltersSchema = z.object({
    search: z.string().optional(),
    model: z
        .enum([
            "openai/gpt-4o",
            "anthropic/claude-sonnet-4",
            "google/gemini-2.0-flash-exp",
        ])
        .optional(),
    status: z
        .enum([
            "pending",
            "generating_outline",
            "generating_questions",
            "completed",
            "failed",
            "cancelled",
        ])
        .optional(),
});

export type SessionFilters = z.infer<typeof sessionFiltersSchema>;

// Type inference from Drizzle schemas
export type KnowledgeSession = typeof knowledgeSessions.$inferSelect;
export type NewKnowledgeSession = typeof knowledgeSessions.$inferInsert;

export type Outline = typeof outlines.$inferSelect;
export type NewOutline = typeof outlines.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
