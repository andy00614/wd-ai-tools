"use server";

import { getCurrentUser } from "@/modules/auth/utils/auth-utils";
import { seedDefaultPrompts } from "./seed-prompts.action";

/**
 * Ensures that default prompts exist for the current user.
 * This should be called on the server side before rendering pages that need templates.
 */
export async function ensureDefaultPrompts() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "User not authenticated",
            };
        }

        // Seed default prompts (will only create if they don't exist)
        const result = await seedDefaultPrompts(user.id);

        return result;
    } catch (error) {
        console.error("Failed to ensure default prompts:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
