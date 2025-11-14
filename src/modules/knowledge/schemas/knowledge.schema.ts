import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "@/modules/auth/schemas/auth.schema";

export const knowledgeSessions = sqliteTable("knowledge_sessions", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    // User Input
    title: text("title").notNull(), // Knowledge point entered by user
    model: text("model").notNull(), // "openai/gpt-4o" | "anthropic/claude-sonnet-4" | "google/gemini-2.0-flash-exp"
    numOutlines: integer("num_outlines").default(5), // Number of outlines/chapters to generate (default: 5)
    questionsPerOutline: integer("questions_per_outline").default(5), // Number of questions to generate per outline (default: 5)

    // Status Tracking
    status: text("status").notNull(), // "pending" | "generating_outline" | "generating_questions" | "completed" | "failed" | "cancelled"
    errorMsg: text("error_msg"),

    // Metadata
    timeConsume: integer("time_consume"), // Total time in milliseconds
    inputToken: integer("input_token"),
    outputToken: integer("output_token"),
    cost: text("cost"), // Total cost in USD (stored as string for precision, e.g., "0.0023")

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .defaultNow()
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),

    // Relations
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const outlines = sqliteTable("outlines", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    sessionId: text("session_id")
        .notNull()
        .references(() => knowledgeSessions.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    orderIndex: integer("order_index").notNull(), // 1, 2, 3...
    status: text("status").notNull(), // "pending" | "generating" | "completed" | "failed"

    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .defaultNow()
        .notNull(),
});

export const questions = sqliteTable("questions", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    sessionId: text("session_id")
        .notNull()
        .references(() => knowledgeSessions.id, { onDelete: "cascade" }),
    outlineId: text("outline_id")
        .notNull()
        .references(() => outlines.id, { onDelete: "cascade" }),

    // Question Content
    content: text("content").notNull(),
    type: text("type").notNull().default("multiple_choice"), // Extensible: "fill_blank", "true_false", etc.
    options: text("options").notNull(), // JSON string: ["A. Option 1", "B. Option 2", ...]
    answer: text("answer").notNull(), // "A" or "B" or "C" or "D"
    explanation: text("explanation"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .defaultNow()
        .notNull(),
});
