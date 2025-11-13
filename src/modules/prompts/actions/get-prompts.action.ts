"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { prompts } from "../schemas/prompt.schema";
import type { PromptWithVariables } from "../models/prompt.model";

export async function getPromptsByType(type: "outline" | "quiz") {
    try {
        const db = await getDb();

        const results = await db
            .select()
            .from(prompts)
            .where(eq(prompts.type, type));

        // Parse variables JSON string to objects
        const parsedResults: PromptWithVariables[] = results.map((prompt) => ({
            ...prompt,
            variables: prompt.variables
                ? JSON.parse(prompt.variables)
                : undefined,
        }));

        return {
            success: true,
            data: parsedResults,
        };
    } catch (error) {
        console.error("Failed to fetch prompts:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function getPromptById(id: string) {
    try {
        const db = await getDb();

        const [result] = await db
            .select()
            .from(prompts)
            .where(eq(prompts.id, id));

        if (!result) {
            return {
                success: false,
                error: "Prompt not found",
            };
        }

        const parsed: PromptWithVariables = {
            ...result,
            variables: result.variables
                ? JSON.parse(result.variables)
                : undefined,
        };

        return {
            success: true,
            data: parsed,
        };
    } catch (error) {
        console.error("Failed to fetch prompt:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
