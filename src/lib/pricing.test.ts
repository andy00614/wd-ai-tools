import { describe, it, expect } from "vitest";
import { calculateCost, formatCost, getModelPricing } from "./pricing";

describe("pricing utilities", () => {
    describe("calculateCost", () => {
        it("should calculate cost correctly for OpenAI GPT-4o", () => {
            // 1000 input tokens + 500 output tokens
            // Expected: (1000/1M * $2.50) + (500/1M * $10.00)
            // = $0.0025 + $0.005 = $0.0075
            const cost = calculateCost("openai/gpt-4o", 1000, 500);
            expect(cost).toBe(0.0075);
        });

        it("should calculate cost correctly for Anthropic Claude Sonnet 4", () => {
            // 2000 input tokens + 1000 output tokens
            // Expected: (2000/1M * $3.00) + (1000/1M * $15.00)
            // = $0.006 + $0.015 = $0.021
            const cost = calculateCost("anthropic/claude-sonnet-4", 2000, 1000);
            expect(cost).toBeCloseTo(0.021, 6);
        });

        it("should return 0 cost for Google Gemini 2.0 Flash (free)", () => {
            const cost = calculateCost(
                "google/gemini-2.0-flash-exp",
                5000,
                2500,
            );
            expect(cost).toBe(0);
        });

        it("should return null for unknown model", () => {
            const cost = calculateCost("unknown/model", 1000, 500);
            expect(cost).toBeNull();
        });

        it("should handle zero tokens", () => {
            const cost = calculateCost("openai/gpt-4o", 0, 0);
            expect(cost).toBe(0);
        });

        it("should calculate correctly for large token counts", () => {
            // 1 million input tokens + 1 million output tokens
            // Expected: (1M/1M * $2.50) + (1M/1M * $10.00) = $12.50
            const cost = calculateCost("openai/gpt-4o", 1_000_000, 1_000_000);
            expect(cost).toBe(12.5);
        });

        it("should handle fractional token costs accurately", () => {
            // 123 input tokens + 456 output tokens
            const cost = calculateCost("openai/gpt-4o", 123, 456);
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
        it("should return pricing for OpenAI GPT-4o", () => {
            const pricing = getModelPricing("openai/gpt-4o");
            expect(pricing).toEqual({
                inputPer1M: 2.5,
                outputPer1M: 10.0,
            });
        });

        it("should return pricing for Anthropic Claude Sonnet 4", () => {
            const pricing = getModelPricing("anthropic/claude-sonnet-4");
            expect(pricing).toEqual({
                inputPer1M: 3.0,
                outputPer1M: 15.0,
            });
        });

        it("should return pricing for Google Gemini (free)", () => {
            const pricing = getModelPricing("google/gemini-2.0-flash-exp");
            expect(pricing).toEqual({
                inputPer1M: 0.0,
                outputPer1M: 0.0,
            });
        });

        it("should return null for unknown model", () => {
            const pricing = getModelPricing("unknown/model");
            expect(pricing).toBeNull();
        });
    });

    describe("pricing consistency", () => {
        it("should have calculateCost and getModelPricing consistent", () => {
            const model = "openai/gpt-4o";
            const inputTokens = 1000;
            const outputTokens = 500;

            const cost = calculateCost(model, inputTokens, outputTokens);
            const pricing = getModelPricing(model);

            expect(pricing).not.toBeNull();

            if (pricing && cost !== null) {
                const expectedCost =
                    (inputTokens / 1_000_000) * pricing.inputPer1M +
                    (outputTokens / 1_000_000) * pricing.outputPer1M;
                expect(cost).toBe(expectedCost);
            }
        });
    });
});
