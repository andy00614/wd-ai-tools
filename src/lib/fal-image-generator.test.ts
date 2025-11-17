import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateImageWithFal } from "./fal-image-generator";

// Mock @fal-ai/client
vi.mock("@fal-ai/client", () => ({
    fal: {
        subscribe: vi.fn(),
        config: vi.fn(),
    },
}));

// Import mocked functions after vi.mock
import { fal } from "@fal-ai/client";

const mockSubscribe = vi.mocked(fal.subscribe);
const _mockConfig = vi.mocked(fal.config);

describe("generateImageWithFal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should generate image with valid prompt", async () => {
        mockSubscribe.mockResolvedValue({
            data: {
                images: [
                    {
                        url: "https://fal.media/files/test-image.png",
                        width: 1024,
                        height: 1024,
                    },
                ],
            },
            requestId: "test-request-id",
        });

        const result = await generateImageWithFal({
            prompt: "A beautiful sunset over mountains",
            apiKey: "test-api-key",
        });

        expect(result.success).toBe(true);
        expect(result.imageUrl).toBe("https://fal.media/files/test-image.png");
        expect(result.width).toBe(1024);
        expect(result.height).toBe(1024);
        expect(mockSubscribe).toHaveBeenCalledWith(
            "fal-ai/imagen4/preview",
            expect.objectContaining({
                input: expect.objectContaining({
                    prompt: "A beautiful sunset over mountains",
                }),
            }),
        );
    });

    it("should use custom image size when provided", async () => {
        mockSubscribe.mockResolvedValue({
            data: {
                images: [
                    {
                        url: "https://fal.media/files/test-image.png",
                        width: 1920,
                        height: 1080,
                    },
                ],
            },
            requestId: "test-request-id",
        });

        const result = await generateImageWithFal({
            prompt: "A cat on a roof",
            apiKey: "test-api-key",
            imageSize: "landscape_16_9",
        });

        expect(result.success).toBe(true);
        expect(mockSubscribe).toHaveBeenCalledWith(
            "fal-ai/imagen4/preview",
            expect.objectContaining({
                input: expect.objectContaining({
                    image_size: "landscape_16_9",
                }),
            }),
        );
    });

    it("should handle API errors gracefully", async () => {
        mockSubscribe.mockRejectedValue(new Error("API rate limit exceeded"));

        const result = await generateImageWithFal({
            prompt: "A test image",
            apiKey: "test-api-key",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("API rate limit exceeded");
    });

    it("should handle empty response", async () => {
        mockSubscribe.mockResolvedValue({
            data: {
                images: [],
            },
            requestId: "test-request-id",
        });

        const result = await generateImageWithFal({
            prompt: "A test image",
            apiKey: "test-api-key",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("No image generated");
    });

    it("should require API key", async () => {
        const result = await generateImageWithFal({
            prompt: "A test image",
            apiKey: "",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("FAL API key is required");
    });

    it("should require prompt", async () => {
        const result = await generateImageWithFal({
            prompt: "",
            apiKey: "test-api-key",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Prompt is required");
    });
});
