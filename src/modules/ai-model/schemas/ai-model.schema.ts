import {
    sqliteTable,
    text,
    integer,
    real,
    unique,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const aiModels = sqliteTable(
    "ai_models",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        provider: text("provider").notNull(),
        modelId: text("model_id").notNull(),
        displayName: text("display_name").notNull(),
        inputPricePerMillion: real("input_price_per_million").notNull(),
        outputPricePerMillion: real("output_price_per_million").notNull(),
        isActive: integer("is_active", { mode: "boolean" })
            .notNull()
            .default(true),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
            .$onUpdate(() => new Date()),
    },
    (table) => ({
        // Unique constraint: same provider cannot have duplicate model_id
        providerModelUnique: unique().on(table.provider, table.modelId),
    }),
);

// Type inference
export type AiModel = typeof aiModels.$inferSelect;
export type NewAiModel = typeof aiModels.$inferInsert;
