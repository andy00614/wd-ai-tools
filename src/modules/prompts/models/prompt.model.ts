import { z } from "zod";
import { prompts } from "../schemas/prompt.schema";

// Zod schemas for validation
export const createPromptSchema = z.object({
    name: z.string().min(1, "Prompt name is required").max(100),
    content: z.string().min(1, "Prompt content is required"),
    type: z.enum([
        "outline_generation",
        "question_generation",
        "image_generation",
    ]),
    isActive: z.boolean().default(true),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;

// Type inference from Drizzle schema
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
