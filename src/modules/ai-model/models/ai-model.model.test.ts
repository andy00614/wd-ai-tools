import { describe, it, expect } from "vitest";
import { aiModelCreateSchema } from "./ai-model.model";

describe("aiModelCreateSchema", () => {
    it("should validate valid OpenAI model", () => {
        const validInput = {
            provider: "openai",
            modelId: "gpt-4o",
            displayName: "GPT-4 Omni",
            inputPricePerMillion: 2.5,
            outputPricePerMillion: 10.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("should validate valid Google model", () => {
        const validInput = {
            provider: "google",
            modelId: "gemini-2.5-flash",
            displayName: "Gemini 2.5 Flash",
            inputPricePerMillion: 0.075,
            outputPricePerMillion: 0.3,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("should validate valid Anthropic model", () => {
        const validInput = {
            provider: "anthropic",
            modelId: "claude-sonnet-4.5",
            displayName: "Claude Sonnet 4.5",
            inputPricePerMillion: 3.0,
            outputPricePerMillion: 15.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("should validate valid Azure model", () => {
        const validInput = {
            provider: "azure",
            modelId: "gpt-4o",
            displayName: "Azure GPT-4 Omni",
            inputPricePerMillion: 2.5,
            outputPricePerMillion: 10.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("should validate valid Groq model", () => {
        const validInput = {
            provider: "groq",
            modelId: "qwen-3-32b",
            displayName: "Qwen 3 32B",
            inputPricePerMillion: 0.1,
            outputPricePerMillion: 0.1,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("should reject invalid provider", () => {
        const invalidInput = {
            provider: "invalid-provider",
            modelId: "gpt-4o",
            displayName: "GPT-4",
            inputPricePerMillion: 2.5,
            outputPricePerMillion: 10.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("should reject empty modelId", () => {
        const invalidInput = {
            provider: "openai",
            modelId: "",
            displayName: "GPT-4",
            inputPricePerMillion: 2.5,
            outputPricePerMillion: 10.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("should reject empty displayName", () => {
        const invalidInput = {
            provider: "openai",
            modelId: "gpt-4o",
            displayName: "",
            inputPricePerMillion: 2.5,
            outputPricePerMillion: 10.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("should reject negative input price", () => {
        const invalidInput = {
            provider: "openai",
            modelId: "gpt-4o",
            displayName: "GPT-4 Omni",
            inputPricePerMillion: -1.0,
            outputPricePerMillion: 10.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("should reject negative output price", () => {
        const invalidInput = {
            provider: "openai",
            modelId: "gpt-4o",
            displayName: "GPT-4 Omni",
            inputPricePerMillion: 2.5,
            outputPricePerMillion: -10.0,
            isActive: true,
        };

        const result = aiModelCreateSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it("should default isActive to true if not provided", () => {
        const input = {
            provider: "openai",
            modelId: "gpt-4o",
            displayName: "GPT-4 Omni",
            inputPricePerMillion: 2.5,
            outputPricePerMillion: 10.0,
        };

        const result = aiModelCreateSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.isActive).toBe(true);
        }
    });
});
