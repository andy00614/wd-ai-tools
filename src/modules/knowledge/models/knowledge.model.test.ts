import { describe, it, expect } from "vitest";
import {
    createSessionSchema,
    outlineItemSchema,
    outlinesResponseSchema,
    questionItemSchema,
    questionsResponseSchema,
    sessionFiltersSchema,
    type CreateSessionInput,
} from "./knowledge.model";

describe("knowledge.model", () => {
    describe("createSessionSchema", () => {
        it("should accept valid knowledge session input", () => {
            const validInput = {
                title: "Learn TypeScript",
                model: "openai/gpt-4o" as const,
            };

            const result = createSessionSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.title).toBe("Learn TypeScript");
                expect(result.data.model).toBe("openai/gpt-4o");
            }
        });

        it("should accept valid model formats", () => {
            const models = [
                "openai/gpt-4o",
                "openai/gpt-5",
                "anthropic/claude-sonnet-4.5",
                "google/gemini-2.5-flash",
                "azure/gpt-4.1-mini",
                "groq/qwen-3-32b",
            ];

            for (const model of models) {
                const result = createSessionSchema.safeParse({
                    title: "Test",
                    model,
                });
                expect(result.success).toBe(true);
            }
        });

        it("should reject empty title", () => {
            const invalidInput = {
                title: "",
                model: "openai/gpt-4o",
            };

            const result = createSessionSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain("required");
            }
        });

        it("should reject title exceeding 200 characters", () => {
            const invalidInput = {
                title: "a".repeat(201),
                model: "openai/gpt-4o",
            };

            const result = createSessionSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain("too long");
            }
        });

        it("should accept title at 200 character boundary", () => {
            const validInput = {
                title: "a".repeat(200),
                model: "openai/gpt-4o",
            };

            const result = createSessionSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should reject invalid model formats", () => {
            const invalidModels = [
                "invalidmodel", // Missing separator
                "OPENAI/gpt-4o", // Uppercase provider
                "openai-gpt-4o", // Wrong separator
                "openai/", // Missing model id
                "/gpt-4o", // Missing provider
            ];

            for (const model of invalidModels) {
                const result = createSessionSchema.safeParse({
                    title: "Test",
                    model,
                });
                expect(result.success).toBe(false);
            }
        });

        it("should accept optional outlinePrompt", () => {
            const validInput = {
                title: "Test",
                model: "openai/gpt-4o" as const,
                outlinePrompt: "Generate 5 topics about...",
            };

            const result = createSessionSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.outlinePrompt).toBe(
                    "Generate 5 topics about...",
                );
            }
        });

        it("should accept optional quizPrompt", () => {
            const validInput = {
                title: "Test",
                model: "openai/gpt-4o" as const,
                quizPrompt: "Generate harder questions...",
            };

            const result = createSessionSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.quizPrompt).toBe(
                    "Generate harder questions...",
                );
            }
        });

        it("should accept both optional prompts", () => {
            const validInput = {
                title: "Test",
                model: "openai/gpt-4o" as const,
                outlinePrompt: "Custom outline prompt",
                quizPrompt: "Custom quiz prompt",
            };

            const result = createSessionSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should work without optional prompts", () => {
            const validInput = {
                title: "Test",
                model: "openai/gpt-4o" as const,
            };

            const result = createSessionSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.outlinePrompt).toBeUndefined();
                expect(result.data.quizPrompt).toBeUndefined();
            }
        });
    });

    describe("outlineItemSchema", () => {
        it("should accept valid outline item", () => {
            const validInput = {
                title: "Introduction to Variables",
            };

            const result = outlineItemSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept outline with optional order", () => {
            const validInput = {
                title: "Advanced Concepts",
                order: 2,
            };

            const result = outlineItemSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.order).toBe(2);
            }
        });

        it("should reject missing title", () => {
            const invalidInput = {
                order: 1,
            };

            const result = outlineItemSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });
    });

    describe("outlinesResponseSchema", () => {
        it("should accept valid outlines response", () => {
            const validInput = {
                outlines: [
                    { title: "Topic 1" },
                    { title: "Topic 2" },
                    { title: "Topic 3" },
                ],
            };

            const result = outlinesResponseSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept empty outlines array", () => {
            const validInput = {
                outlines: [],
            };

            const result = outlinesResponseSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should reject missing outlines field", () => {
            const invalidInput = {};

            const result = outlinesResponseSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });
    });

    describe("questionItemSchema", () => {
        it("should accept valid question item", () => {
            const validInput = {
                content: "What is TypeScript?",
                options: [
                    "A. A superset of JavaScript",
                    "B. A database",
                    "C. A framework",
                    "D. An IDE",
                ],
                answer: "A" as const,
            };

            const result = questionItemSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should require exactly 4 options", () => {
            const invalidInput = {
                content: "Test question?",
                options: ["A. Option 1", "B. Option 2", "C. Option 3"], // Only 3
                answer: "A",
            };

            const result = questionItemSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should reject more than 4 options", () => {
            const invalidInput = {
                content: "Test question?",
                options: [
                    "A. Option 1",
                    "B. Option 2",
                    "C. Option 3",
                    "D. Option 4",
                    "E. Option 5",
                ], // 5 options
                answer: "A",
            };

            const result = questionItemSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should reject less than 4 options", () => {
            const invalidInput = {
                content: "Test question?",
                options: ["A. Option 1"], // Only 1
                answer: "A",
            };

            const result = questionItemSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should accept valid answer choices A, B, C, D", () => {
            const validAnswers = ["A", "B", "C", "D"] as const;

            for (const answer of validAnswers) {
                const result = questionItemSchema.safeParse({
                    content: "Test?",
                    options: ["A. 1", "B. 2", "C. 3", "D. 4"],
                    answer,
                });
                expect(result.success).toBe(true);
            }
        });

        it("should reject invalid answer choice", () => {
            const invalidInput = {
                content: "Test?",
                options: ["A. 1", "B. 2", "C. 3", "D. 4"],
                answer: "E", // Invalid
            };

            const result = questionItemSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should accept optional explanation", () => {
            const validInput = {
                content: "What is 2+2?",
                options: ["A. 3", "B. 4", "C. 5", "D. 6"],
                answer: "B" as const,
                explanation: "Basic arithmetic: 2 plus 2 equals 4",
            };

            const result = questionItemSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.explanation).toBe(
                    "Basic arithmetic: 2 plus 2 equals 4",
                );
            }
        });

        it("should work without explanation", () => {
            const validInput = {
                content: "What is 2+2?",
                options: ["A. 3", "B. 4", "C. 5", "D. 6"],
                answer: "B" as const,
            };

            const result = questionItemSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.explanation).toBeUndefined();
            }
        });
    });

    describe("questionsResponseSchema", () => {
        it("should accept valid questions response", () => {
            const validInput = {
                questions: [
                    {
                        content: "Question 1?",
                        options: ["A. 1", "B. 2", "C. 3", "D. 4"],
                        answer: "A" as const,
                    },
                    {
                        content: "Question 2?",
                        options: ["A. a", "B. b", "C. c", "D. d"],
                        answer: "B" as const,
                    },
                ],
            };

            const result = questionsResponseSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept empty questions array", () => {
            const validInput = {
                questions: [],
            };

            const result = questionsResponseSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should reject questions with invalid items", () => {
            const invalidInput = {
                questions: [
                    {
                        content: "Question?",
                        options: ["A. 1", "B. 2"], // Only 2 options (invalid)
                        answer: "A",
                    },
                ],
            };

            const result = questionsResponseSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });
    });

    describe("sessionFiltersSchema", () => {
        it("should accept empty filters", () => {
            const validInput = {};

            const result = sessionFiltersSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept search filter", () => {
            const validInput = {
                search: "TypeScript",
            };

            const result = sessionFiltersSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept model filter", () => {
            const validInput = {
                model: "openai/gpt-4o" as const,
            };

            const result = sessionFiltersSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept status filter", () => {
            const validInput = {
                status: "completed" as const,
            };

            const result = sessionFiltersSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept all filters combined", () => {
            const validInput = {
                search: "TypeScript",
                model: "anthropic/claude-sonnet-4" as const,
                status: "generating_questions" as const,
            };

            const result = sessionFiltersSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should accept all valid status values", () => {
            const validStatuses = [
                "pending",
                "generating_outline",
                "generating_questions",
                "completed",
                "failed",
                "cancelled",
            ] as const;

            for (const status of validStatuses) {
                const result = sessionFiltersSchema.safeParse({ status });
                expect(result.success).toBe(true);
            }
        });

        it("should reject invalid status", () => {
            const invalidInput = {
                status: "invalid_status",
            };

            const result = sessionFiltersSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should reject invalid model formats in filter", () => {
            const invalidModels = [
                "OPENAI/gpt-4o", // Uppercase provider
                "openai-gpt-4o", // Wrong separator
                "invalidmodel", // Missing separator
            ];

            for (const model of invalidModels) {
                const result = sessionFiltersSchema.safeParse({ model });
                expect(result.success).toBe(false);
            }
        });
    });
});
