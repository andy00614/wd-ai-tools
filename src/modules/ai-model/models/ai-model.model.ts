import { z } from "zod";

export const aiModelProviders = [
    "openai",
    "google",
    "anthropic",
    "azure",
    "groq",
] as const;

export const aiModelCreateSchema = z.object({
    provider: z.enum(aiModelProviders),
    modelId: z.string().min(1, "Model ID is required"),
    displayName: z.string().min(1, "Display name is required"),
    inputPricePerMillion: z.number().min(0, "Input price must be non-negative"),
    outputPricePerMillion: z
        .number()
        .min(0, "Output price must be non-negative"),
    isActive: z.boolean().default(true),
});

export type AiModelCreate = z.infer<typeof aiModelCreateSchema>;
