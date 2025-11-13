import { z } from "zod";
import type { prompts } from "../schemas/prompt.schema";

// Template Variable Schema
export const templateVariableSchema = z.object({
    name: z.string(), // e.g., "{{num_sections}}"
    displayName: z.string().optional(), // e.g., "章节数量"
    type: z.enum(["text", "select", "number", "boolean"]),
    required: z.boolean().optional().default(false),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    options: z.array(z.string()).optional(), // For select type
    placeholder: z.string().optional(),
    min: z.number().optional(), // For number type
    max: z.number().optional(), // For number type
});

export type TemplateVariable = z.infer<typeof templateVariableSchema>;

// Zod schemas for validation
export const createPromptSchema = z.object({
    name: z.string().min(1, "Prompt name is required").max(100),
    content: z.string().min(1, "Prompt content is required"),
    type: z.enum(["outline", "quiz"]),
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    variables: z.array(templateVariableSchema).optional(),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;

// Type inference from Drizzle schema
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;

// Extended type for prompts with parsed variables
export type PromptWithVariables = Omit<Prompt, "variables"> & {
    variables?: TemplateVariable[];
};
