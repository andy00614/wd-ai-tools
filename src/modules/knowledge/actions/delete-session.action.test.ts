import { describe, it, expect, beforeEach, vi } from "vitest";
import { deleteSession } from "./delete-session.action";

// Mock dependencies
vi.mock("@/db", () => ({
    getDb: vi.fn(),
}));

vi.mock("@/modules/auth/utils/auth-utils", () => ({
    requireAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("deleteSession", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return error if session is not found", async () => {
        const { requireAuth } = await import("@/modules/auth/utils/auth-utils");
        const { getDb } = await import("@/db");

        // Mock authenticated user
        vi.mocked(requireAuth).mockResolvedValue({
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
        } as any);

        // Mock database to return empty result (session not found)
        const mockDelete = vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([]),
            }),
        });

        vi.mocked(getDb).mockResolvedValue({
            delete: mockDelete,
        } as any);

        const result = await deleteSession("non-existent-id");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Session not found or unauthorized");
    });

    it("should successfully delete session", async () => {
        const { requireAuth } = await import("@/modules/auth/utils/auth-utils");
        const { getDb } = await import("@/db");
        const { revalidatePath } = await import("next/cache");

        // Mock authenticated user
        vi.mocked(requireAuth).mockResolvedValue({
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
        } as any);

        // Mock database to return deleted session
        const mockDelete = vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([
                    {
                        id: "session-1",
                        userId: "user-1",
                        title: "Test Session",
                    },
                ]),
            }),
        });

        vi.mocked(getDb).mockResolvedValue({
            delete: mockDelete,
        } as any);

        const result = await deleteSession("session-1");

        expect(result.success).toBe(true);
        expect(revalidatePath).toHaveBeenCalledWith("/dashboard/knowledge");
    });

    it("should handle database errors", async () => {
        const { requireAuth } = await import("@/modules/auth/utils/auth-utils");
        const { getDb } = await import("@/db");

        vi.mocked(requireAuth).mockResolvedValue({
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
        } as any);

        // Mock database to throw error
        vi.mocked(getDb).mockRejectedValue(new Error("Database error"));

        const result = await deleteSession("session-1");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Database error");
    });

    it("should handle authentication errors", async () => {
        const { requireAuth } = await import("@/modules/auth/utils/auth-utils");

        // Mock authentication failure
        vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

        const result = await deleteSession("session-1");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
    });
});
