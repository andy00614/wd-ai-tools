import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "@/modules/auth/schemas/auth.schema";

export const prompts = sqliteTable("prompts", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    name: text("name").notNull(),
    content: text("content").notNull(),
    type: text("type").notNull(), // "outline_generation" | "question_generation" | etc.
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

    // User relation - allows users to create custom prompts
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),

    createdAt: integer("created_at", { mode: "timestamp" })
        .defaultNow()
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
