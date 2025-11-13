"use server";

import { getDb } from "@/db";
import { aiModels } from "../schemas/ai-model.schema";
import type { NewAiModel, AiModel } from "../schemas/ai-model.schema";
import type { ApiResponse } from "@/lib/api-response";

const predefinedModels: Omit<NewAiModel, "id" | "createdAt" | "updatedAt">[] = [
    // OpenAI Models
    {
        provider: "openai",
        modelId: "gpt-4o",
        displayName: "GPT-4 Omni",
        inputPricePerMillion: 2.5,
        outputPricePerMillion: 10.0,
        isActive: true,
    },
    {
        provider: "openai",
        modelId: "gpt-5",
        displayName: "GPT-5",
        inputPricePerMillion: 5.0, // Estimated pricing
        outputPricePerMillion: 15.0,
        isActive: true,
    },
    {
        provider: "openai",
        modelId: "gpt-4.1-mini",
        displayName: "GPT-4.1 Mini",
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
        isActive: true,
    },

    // Google Models
    {
        provider: "google",
        modelId: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        inputPricePerMillion: 0.075,
        outputPricePerMillion: 0.3,
        isActive: true,
    },

    // Anthropic Models
    {
        provider: "anthropic",
        modelId: "claude-haiku-4.5",
        displayName: "Claude Haiku 4.5",
        inputPricePerMillion: 0.8,
        outputPricePerMillion: 4.0,
        isActive: true,
    },
    {
        provider: "anthropic",
        modelId: "claude-sonnet-4.5",
        displayName: "Claude Sonnet 4.5",
        inputPricePerMillion: 3.0,
        outputPricePerMillion: 15.0,
        isActive: true,
    },

    // Azure Models (typically same as OpenAI with small markup)
    {
        provider: "azure",
        modelId: "gpt-4o",
        displayName: "Azure GPT-4 Omni",
        inputPricePerMillion: 2.5,
        outputPricePerMillion: 10.0,
        isActive: true,
    },
    {
        provider: "azure",
        modelId: "gpt-5",
        displayName: "Azure GPT-5",
        inputPricePerMillion: 5.0,
        outputPricePerMillion: 15.0,
        isActive: true,
    },
    {
        provider: "azure",
        modelId: "gpt-4.1-mini",
        displayName: "Azure GPT-4.1 Mini",
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
        isActive: true,
    },

    // Groq Models (very competitive pricing)
    {
        provider: "groq",
        modelId: "qwen-3-32b",
        displayName: "Qwen 3 32B",
        inputPricePerMillion: 0.1,
        outputPricePerMillion: 0.1,
        isActive: true,
    },
];

export async function seedAiModels(): Promise<ApiResponse<AiModel[]>> {
    try {
        const db = await getDb();

        const insertedModels = await db
            .insert(aiModels)
            .values(predefinedModels)
            .returning();

        return {
            success: true,
            data: insertedModels,
            error: null,
        };
    } catch (error) {
        console.error("Failed to seed AI models:", error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function getAllAiModels(): Promise<ApiResponse<AiModel[]>> {
    try {
        const db = await getDb();
        const models = await db.select().from(aiModels);

        return {
            success: true,
            data: models,
            error: null,
        };
    } catch (error) {
        console.error("Failed to get AI models:", error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
