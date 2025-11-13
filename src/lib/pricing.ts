/**
 * Pricing utility for calculating AI model costs
 * Prices are in USD per 1M tokens
 * Last updated: 2025-01-13
 */

type ModelPricing = {
    inputPer1M: number; // USD per 1M input tokens
    outputPer1M: number; // USD per 1M output tokens
};

/**
 * Current pricing for supported AI models
 * Source: Official provider pricing pages
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
    // OpenAI GPT-4o
    "openai/gpt-4o": {
        inputPer1M: 2.5, // $2.50 per 1M input tokens
        outputPer1M: 10.0, // $10.00 per 1M output tokens
    },

    // Anthropic Claude Sonnet 4
    "anthropic/claude-sonnet-4": {
        inputPer1M: 3.0, // $3.00 per 1M input tokens
        outputPer1M: 15.0, // $15.00 per 1M output tokens
    },

    // Google Gemini 2.0 Flash
    "google/gemini-2.0-flash-exp": {
        inputPer1M: 0.0, // Free during preview (as of Jan 2025)
        outputPer1M: 0.0,
    },
};

/**
 * Calculate the cost of an AI model API call
 *
 * @param model - Model identifier (e.g., "openai/gpt-4o")
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @returns Cost in USD, or null if model pricing is unavailable
 */
export function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
): number | null {
    const pricing = MODEL_PRICING[model];

    if (!pricing) {
        console.warn(`[Pricing] No pricing data available for model: ${model}`);
        return null;
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
    const totalCost = inputCost + outputCost;

    return totalCost;
}

/**
 * Format cost as USD string with appropriate precision
 *
 * @param cost - Cost in USD
 * @returns Formatted string (e.g., "$0.0023" or "$1.25")
 */
export function formatCost(cost: number): string {
    if (cost < 0.01) {
        // Show 4 decimal places for very small amounts
        return `$${cost.toFixed(4)}`;
    }
    // Show 2 decimal places for normal amounts
    return `$${cost.toFixed(2)}`;
}

/**
 * Get pricing information for a specific model
 *
 * @param model - Model identifier
 * @returns Pricing info or null if unavailable
 */
export function getModelPricing(model: string): ModelPricing | null {
    return MODEL_PRICING[model] ?? null;
}
