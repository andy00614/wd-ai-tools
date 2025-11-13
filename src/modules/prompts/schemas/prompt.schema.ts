import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "@/modules/auth/schemas/auth.schema";

export const prompts = sqliteTable("prompts", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    name: text("name").notNull(),
    content: text("content").notNull(),
    type: text("type").notNull(), // "outline" | "quiz" | etc.
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isDefault: integer("is_default", { mode: "boolean" })
        .notNull()
        .default(false), // Marks if this is the default template for its type

    // Variables configuration stored as JSON
    // Example: [{"name": "{{num_sections}}", "displayName": "章节数量", "type": "number", "defaultValue": 5}]
    variables: text("variables"), // JSON string

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
