import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import type { GenerateClueResponse } from "@/types/questions";

// Mock dependencies
vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: vi.fn(() => ({
        env: {
            AI_GATEWAY_API_KEY: "test-api-key",
        },
    })),
}));

vi.mock("ai", () => ({
    createGateway: vi.fn(() => vi.fn()),
    generateObject: vi.fn(),
}));

describe("POST /api/questions-game/generate-clue", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 400 if knowledgePoint is missing", async () => {
        const request = new NextRequest("http://localhost:3001/api/test", {
            method: "POST",
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = (await response.json()) as GenerateClueResponse;

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("知识点不能为空");
    });

    it("should return 400 if knowledgePoint is empty string", async () => {
        const request = new NextRequest("http://localhost:3001/api/test", {
            method: "POST",
            body: JSON.stringify({ knowledgePoint: "   " }),
        });

        const response = await POST(request);
        const data = (await response.json()) as GenerateClueResponse;

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
    });

    it("should accept valid request with default difficulty", async () => {
        const { generateObject } = await import("ai");

        vi.mocked(generateObject).mockResolvedValue({
            object: {
                clues: ["线索1", "线索2", "线索3"],
                answer: "测试答案",
                tags: ["测试"],
                explanation: "这是解释",
            },
            usage: {
                inputTokens: 100,
                outputTokens: 50,
            },
        } as never);

        const request = new NextRequest("http://localhost:3001/api/test", {
            method: "POST",
            body: JSON.stringify({
                knowledgePoint: "测试知识点",
            }),
        });

        const response = await POST(request);
        const data = (await response.json()) as GenerateClueResponse;

        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty("id");
        expect(data.data).toHaveProperty("type", "clue");
        expect(data.data).toHaveProperty("knowledgePoint", "测试知识点");
        expect(data.data).toHaveProperty("difficulty", 2); // default
        expect(data.data?.clues).toBeInstanceOf(Array);
        expect(data.data?.answer).toBe("测试答案");
    });

    it("should accept custom difficulty level", async () => {
        const { generateObject } = await import("ai");

        vi.mocked(generateObject).mockResolvedValue({
            object: {
                clues: ["简单线索1", "简单线索2"],
                answer: "简单答案",
                tags: ["简单"],
            },
            usage: {
                inputTokens: 80,
                outputTokens: 40,
            },
        } as never);

        const request = new NextRequest("http://localhost:3001/api/test", {
            method: "POST",
            body: JSON.stringify({
                knowledgePoint: "简单知识点",
                difficulty: 1,
            }),
        });

        const response = await POST(request);
        const data = (await response.json()) as GenerateClueResponse;

        expect(data.success).toBe(true);
        expect(data.data?.difficulty).toBe(1);
    });

    it("should handle AI generation errors", async () => {
        const { generateObject } = await import("ai");

        vi.mocked(generateObject).mockRejectedValue(
            new Error("AI service unavailable"),
        );

        const request = new NextRequest("http://localhost:3001/api/test", {
            method: "POST",
            body: JSON.stringify({
                knowledgePoint: "错误测试",
            }),
        });

        const response = await POST(request);
        const data = (await response.json()) as GenerateClueResponse;

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
    });

    it("should generate unique question IDs", async () => {
        const { generateObject } = await import("ai");

        vi.mocked(generateObject).mockResolvedValue({
            object: {
                clues: ["线索"],
                answer: "答案",
                tags: ["标签"],
            },
            usage: {
                inputTokens: 50,
                outputTokens: 30,
            },
        } as never);

        const request1 = new NextRequest("http://localhost:3001/api/test", {
            method: "POST",
            body: JSON.stringify({ knowledgePoint: "知识点1" }),
        });

        const request2 = new NextRequest("http://localhost:3001/api/test", {
            method: "POST",
            body: JSON.stringify({ knowledgePoint: "知识点2" }),
        });

        const response1 = await POST(request1);
        const response2 = await POST(request2);

        const data1 = (await response1.json()) as GenerateClueResponse;
        const data2 = (await response2.json()) as GenerateClueResponse;

        expect(data1.data?.id).not.toBe(data2.data?.id);
    });
});
