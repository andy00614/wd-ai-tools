import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
    calculateCost,
    formatCost,
    getModelPricing,
    loadPricingFromDatabase,
    setPricingCache,
    clearPricingCache,
} from "./pricing";

describe("pricing utilities", () => {
    // Set up mock pricing data for tests
    beforeAll(() => {
        // Mock pricing data matching database seed
        setPricingCache({
            "openai/gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
            "openai/gpt-5": { inputPer1M: 5.0, outputPer1M: 15.0 },
            "openai/gpt-4.1-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
            "google/gemini-2.5-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
            "anthropic/claude-haiku-4.5": { inputPer1M: 0.8, outputPer1M: 4.0 },
            "anthropic/claude-sonnet-4.5": {
                inputPer1M: 3.0,
                outputPer1M: 15.0,
            },
            "azure/gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
            "azure/gpt-5": { inputPer1M: 5.0, outputPer1M: 15.0 },
            "azure/gpt-4.1-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
            "groq/qwen-3-32b": { inputPer1M: 0.1, outputPer1M: 0.1 },
        });
    });

    afterAll(() => {
        clearPricingCache();
    });

    describe("calculateCost", () => {
        it("should calculate cost correctly for OpenAI GPT-4o", async () => {
            // 1000 input tokens + 500 output tokens
            // Expected: (1000/1M * $2.50) + (500/1M * $10.00)
            // = $0.0025 + $0.005 = $0.0075
            const cost = await calculateCost("openai/gpt-4o", 1000, 500);
            expect(cost).toBe(0.0075);
        });

        it("should calculate cost correctly for Azure GPT-4o", async () => {
            // 1000 input tokens + 500 output tokens
            // Expected: (1000/1M * $2.50) + (500/1M * $10.00)
            // = $0.0025 + $0.005 = $0.0075
            const cost = await calculateCost("azure/gpt-4o", 1000, 500);
            expect(cost).toBe(0.0075);
        });

        it("should calculate cost correctly for Anthropic Claude Sonnet 4.5", async () => {
            // 2000 input tokens + 1000 output tokens
            // Expected: (2000/1M * $3.00) + (1000/1M * $15.00)
            // = $0.006 + $0.015 = $0.021
            const cost = await calculateCost(
                "anthropic/claude-sonnet-4.5",
                2000,
                1000,
            );
            expect(cost).toBeCloseTo(0.021, 6);
        });

        it("should calculate cost for Google Gemini 2.5 Flash", async () => {
            // 5000 input tokens + 2500 output tokens
            // Expected: (5000/1M * $0.075) + (2500/1M * $0.3)
            // = $0.000375 + $0.00075 = $0.001125
            const cost = await calculateCost(
                "google/gemini-2.5-flash",
                5000,
                2500,
            );
            expect(cost).toBeCloseTo(0.001125, 6);
        });

        it("should return null for unknown model", async () => {
            const cost = await calculateCost("unknown/model", 1000, 500);
            expect(cost).toBeNull();
        });

        it("should handle zero tokens", async () => {
            const cost = await calculateCost("openai/gpt-4o", 0, 0);
            expect(cost).toBe(0);
        });

        it("should calculate correctly for large token counts", async () => {
            // 1 million input tokens + 1 million output tokens
            // Expected: (1M/1M * $2.50) + (1M/1M * $10.00) = $12.50
            const cost = await calculateCost(
                "openai/gpt-4o",
                1_000_000,
                1_000_000,
            );
            expect(cost).toBe(12.5);
        });

        it("should handle fractional token costs accurately", async () => {
            // 123 input tokens + 456 output tokens
            const cost = await calculateCost("openai/gpt-4o", 123, 456);
            expect(cost).toBeCloseTo(0.004868, 6);
        });
    });

    describe("formatCost", () => {
        it("should format small costs with 4 decimal places", () => {
            expect(formatCost(0.0023)).toBe("$0.0023");
            expect(formatCost(0.0001)).toBe("$0.0001");
            expect(formatCost(0.009999)).toBe("$0.0100");
        });

        it("should format normal costs with 2 decimal places", () => {
            expect(formatCost(0.01)).toBe("$0.01");
            expect(formatCost(1.25)).toBe("$1.25");
            expect(formatCost(10.5)).toBe("$10.50");
        });

        it("should handle zero cost", () => {
            expect(formatCost(0)).toBe("$0.0000");
        });

        it("should handle large costs", () => {
            expect(formatCost(1234.56)).toBe("$1234.56");
        });
    });

    describe("getModelPricing", () => {
        it("should return pricing for OpenAI GPT-4o", async () => {
            const pricing = await getModelPricing("openai/gpt-4o");
            expect(pricing).toEqual({
                inputPer1M: 2.5,
                outputPer1M: 10.0,
            });
        });

        it("should return pricing for Azure GPT-4o", async () => {
            const pricing = await getModelPricing("azure/gpt-4o");
            expect(pricing).toEqual({
                inputPer1M: 2.5,
                outputPer1M: 10.0,
            });
        });

        it("should return pricing for Anthropic Claude Sonnet 4.5", async () => {
            const pricing = await getModelPricing(
                "anthropic/claude-sonnet-4.5",
            );
            expect(pricing).toEqual({
                inputPer1M: 3.0,
                outputPer1M: 15.0,
            });
        });

        it("should return pricing for Google Gemini 2.5 Flash", async () => {
            const pricing = await getModelPricing("google/gemini-2.5-flash");
            expect(pricing).toEqual({
                inputPer1M: 0.075,
                outputPer1M: 0.3,
            });
        });

        it("should return null for unknown model", async () => {
            const pricing = await getModelPricing("unknown/model");
            expect(pricing).toBeNull();
        });
    });

    describe("pricing consistency", () => {
        it("should have calculateCost and getModelPricing consistent", async () => {
            const model = "openai/gpt-4o";
            const inputTokens = 1000;
            const outputTokens = 500;

            const cost = await calculateCost(model, inputTokens, outputTokens);
            const pricing = await getModelPricing(model);

            expect(pricing).not.toBeNull();

            if (pricing && cost !== null) {
                const expectedCost =
                    (inputTokens / 1_000_000) * pricing.inputPer1M +
                    (outputTokens / 1_000_000) * pricing.outputPer1M;
                expect(cost).toBe(expectedCost);
            }
        });
    });

    describe("cache management", () => {
        it("should return all cached models", async () => {
            // Should be able to get pricing for all database models
            const azurePricing = await getModelPricing("azure/gpt-4o");
            expect(azurePricing).not.toBeNull();
            expect(azurePricing).toEqual({
                inputPer1M: 2.5,
                outputPer1M: 10.0,
            });

            const groqPricing = await getModelPricing("groq/qwen-3-32b");
            expect(groqPricing).not.toBeNull();
            expect(groqPricing).toEqual({ inputPer1M: 0.1, outputPer1M: 0.1 });
        });

        it("should allow clearing cache", () => {
            clearPricingCache();
            setPricingCache({
                "test/model": { inputPer1M: 1.0, outputPer1M: 2.0 },
            });

            // Cleanup for other tests
            clearPricingCache();
            setPricingCache({
                "openai/gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
                "openai/gpt-5": { inputPer1M: 5.0, outputPer1M: 15.0 },
                "openai/gpt-4.1-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
                "google/gemini-2.5-flash": {
                    inputPer1M: 0.075,
                    outputPer1M: 0.3,
                },
                "anthropic/claude-haiku-4.5": {
                    inputPer1M: 0.8,
                    outputPer1M: 4.0,
                },
                "anthropic/claude-sonnet-4.5": {
                    inputPer1M: 3.0,
                    outputPer1M: 15.0,
                },
                "azure/gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
                "azure/gpt-5": { inputPer1M: 5.0, outputPer1M: 15.0 },
                "azure/gpt-4.1-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
                "groq/qwen-3-32b": { inputPer1M: 0.1, outputPer1M: 0.1 },
            });
        });
    });
});
