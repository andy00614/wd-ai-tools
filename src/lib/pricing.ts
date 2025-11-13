/**
 * Pricing utility for calculating AI model costs
 * Prices are loaded from database and cached in memory
 * Last updated: 2025-01-13
 */

import { getDb } from "@/db";
import { aiModels } from "@/modules/ai-model/schemas/ai-model.schema";
import { eq } from "drizzle-orm";

type ModelPricing = {
    inputPer1M: number; // USD per 1M input tokens
    outputPer1M: number; // USD per 1M output tokens
};

/**
 * In-memory cache for model pricing
 * Loaded from database on first access
 */
let pricingCache: Record<string, ModelPricing> | null = null;

/**
 * Set pricing cache directly (for testing purposes)
 * @param pricing - Pricing data to set
 */
export function setPricingCache(pricing: Record<string, ModelPricing>): void {
    pricingCache = pricing;
}

/**
 * Clear pricing cache (for testing purposes)
 */
export function clearPricingCache(): void {
    pricingCache = null;
}

/**
 * Load pricing data from database into memory cache
 * Should be called once at application startup or before running tests
 */
export async function loadPricingFromDatabase(): Promise<void> {
    try {
        const db = await getDb();
        const models = await db
            .select()
            .from(aiModels)
            .where(eq(aiModels.isActive, true));

        pricingCache = {};
        for (const model of models) {
            const modelKey = `${model.provider}/${model.modelId}`;
            pricingCache[modelKey] = {
                inputPer1M: model.inputPricePerMillion,
                outputPer1M: model.outputPricePerMillion,
            };
        }

        console.log(`[Pricing] Loaded pricing for ${models.length} models`);
    } catch (error) {
        console.error("[Pricing] Failed to load pricing from database:", error);
        pricingCache = {}; // Empty cache on error
    }
}

/**
 * Ensure pricing cache is loaded
 * Auto-loads on first access if not already loaded
 */
async function ensurePricingLoaded(): Promise<void> {
    if (pricingCache === null) {
        await loadPricingFromDatabase();
    }
}

/**
 * Calculate the cost of an AI model API call
 *
 * @param model - Model identifier (e.g., "openai/gpt-4o")
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @returns Cost in USD, or null if model pricing is unavailable
 */
export async function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
): Promise<number | null> {
    await ensurePricingLoaded();

    const pricing = pricingCache?.[model];

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
export async function getModelPricing(
    model: string,
): Promise<ModelPricing | null> {
    await ensurePricingLoaded();
    return pricingCache?.[model] ?? null;
}
