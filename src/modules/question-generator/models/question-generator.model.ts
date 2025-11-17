import { z } from "zod";

/**
 * Zod schemas for question generator module
 */

// Category types
export const knowledgeCategorySchema = z.enum([
    "person",
    "event",
    "concept",
    "place",
    "invention",
    "process",
    "time",
]);

// Question types
export const questionTypeSchema = z.enum([
    "clue",
    "fill-blank",
    "guess-image",
    "event-order",
    "matching",
]);

// Difficulty levels
export const difficultySchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
]);

// Knowledge point node schema (recursive)
export const knowledgePointSchema: z.ZodType<{
    id: string;
    name: string;
    category: z.infer<typeof knowledgeCategorySchema>;
    description?: string;
    children?: Array<{
        id: string;
        name: string;
        category: z.infer<typeof knowledgeCategorySchema>;
        description?: string;
        recommendedTypes: z.infer<typeof questionTypeSchema>[];
        difficulty?: z.infer<typeof difficultySchema>;
    }>;
    recommendedTypes: z.infer<typeof questionTypeSchema>[];
    difficulty?: z.infer<typeof difficultySchema>;
}> = z.lazy(() =>
    z.object({
        id: z.string(),
        name: z.string().min(1, "Knowledge point name is required"),
        category: knowledgeCategorySchema,
        description: z.string().optional(),
        children: z.array(knowledgePointSchema).optional(),
        recommendedTypes: z
            .array(questionTypeSchema)
            .min(1, "At least one question type must be recommended"),
        difficulty: difficultySchema.optional(),
    }),
);

// Knowledge breakdown result schema
export const knowledgeBreakdownSchema = z.object({
    originalInput: z.string(),
    mainCategory: knowledgeCategorySchema,
    breakdown: z.array(knowledgePointSchema),
    totalPoints: z.number().int().positive(),
});

// Generation config schema
export const generationConfigSchema = z.object({
    knowledgePoint: z
        .string()
        .min(2, "Knowledge point must be at least 2 characters")
        .max(200, "Knowledge point is too long"),
    questionsPerType: z.number().int().positive().max(10).default(1).optional(),
    difficulty: difficultySchema.optional(),
    includeTypes: z.array(questionTypeSchema).optional(),
});

// Individual question schemas
export const clueQuestionSchema = z.object({
    id: z.string(),
    type: z.literal("clue"),
    knowledgePoint: z.string(),
    difficulty: difficultySchema,
    tags: z.array(z.string()),
    clues: z.array(z.string()).min(3, "At least 3 clues required"),
    answer: z.string().min(1, "Answer is required"),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

export const fillBlankQuestionSchema = z.object({
    id: z.string(),
    type: z.literal("fill-blank"),
    knowledgePoint: z.string(),
    difficulty: difficultySchema,
    tags: z.array(z.string()),
    sentence: z.string().min(1, "Sentence is required"),
    blanks: z
        .array(
            z.object({
                position: z.number().int().nonnegative(),
                answer: z.string().min(1),
            }),
        )
        .min(1, "At least one blank required"),
    options: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

export const guessImageQuestionSchema = z.object({
    id: z.string(),
    type: z.literal("guess-image"),
    knowledgePoint: z.string(),
    difficulty: difficultySchema,
    tags: z.array(z.string()),
    imageUrl: z.string().url().optional(),
    imagePrompt: z.string().min(10, "Image prompt must be detailed").optional(), // Detailed English prompt for image generation (Imagen format)
    description: z.string().min(1, "Description is required"), // Brief Chinese description (fallback)
    guessType: z.enum(["movie", "person", "place", "object", "other"]),
    answer: z.string().min(1, "Answer is required"),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

export const eventOrderQuestionSchema = z.object({
    id: z.string(),
    type: z.literal("event-order"),
    knowledgePoint: z.string(),
    difficulty: difficultySchema,
    tags: z.array(z.string()),
    events: z
        .array(
            z.object({
                id: z.string(),
                description: z.string().min(1),
                year: z.number().int().optional(),
            }),
        )
        .min(3, "At least 3 events required for ordering"),
    correctOrder: z.array(z.string()).min(3),
    explanation: z.string().optional(),
});

export const matchingQuestionSchema = z.object({
    id: z.string(),
    type: z.literal("matching"),
    knowledgePoint: z.string(),
    difficulty: difficultySchema,
    tags: z.array(z.string()),
    leftItems: z
        .array(
            z.object({
                id: z.string(),
                content: z.string().min(1, "Content is required"),
            }),
        )
        .min(2, "At least 2 left items required for matching"),
    rightItems: z
        .array(
            z.object({
                id: z.string(),
                content: z.string().min(1, "Content is required"),
            }),
        )
        .min(2, "At least 2 right items required for matching"),
    correctPairs: z
        .array(
            z.object({
                leftId: z.string(),
                rightId: z.string(),
            }),
        )
        .min(1, "At least 1 correct pair required"),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

// Union schema for any generated question
export const generatedQuestionSchema = z.discriminatedUnion("type", [
    clueQuestionSchema,
    fillBlankQuestionSchema,
    guessImageQuestionSchema,
    eventOrderQuestionSchema,
    matchingQuestionSchema,
]);

// Complete generation result schema
export const questionGenerationResultSchema = z.object({
    knowledgeBreakdown: knowledgeBreakdownSchema,
    questions: z.array(generatedQuestionSchema),
    totalGenerated: z.number().int().nonnegative(),
    generationTime: z.number().nonnegative(),
});

// Type inference
export type GenerationConfig = z.infer<typeof generationConfigSchema>;
export type KnowledgeBreakdown = z.infer<typeof knowledgeBreakdownSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type QuestionGenerationResult = z.infer<
    typeof questionGenerationResultSchema
>;
