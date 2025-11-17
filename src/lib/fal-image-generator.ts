import { fal } from "@fal-ai/client";

/**
 * Image size options for FAL AI Imagen 4 model
 */
export type FalImageSize =
    | "square_hd" // 1024x1024
    | "square" // 512x512
    | "portrait_4_3" // 768x1024
    | "portrait_16_9" // 576x1024
    | "landscape_4_3" // 1024x768
    | "landscape_16_9"; // 1024x576

/**
 * FAL AI image result type
 */
interface FalImageResult {
    url: string;
    width: number;
    height: number;
    content_type?: string;
}

/**
 * FAL AI response type
 */
interface FalResponse {
    images: FalImageResult[];
}

/**
 * Parameters for generating an image with FAL AI
 */
export interface GenerateImageParams {
    prompt: string;
    apiKey: string;
    imageSize?: FalImageSize;
    numInferenceSteps?: number; // Default: 28
    enableSafetyChecker?: boolean; // Default: true
}

/**
 * Result of image generation
 */
export interface GenerateImageResult {
    success: boolean;
    imageUrl?: string;
    width?: number;
    height?: number;
    error?: string;
    requestId?: string;
}

/**
 * Generate an image using FAL AI's Imagen 4 model (fal-ai/imagen4/preview)
 *
 * @param params - Image generation parameters
 * @returns Promise with generation result
 *
 * @example
 * ```ts
 * const result = await generateImageWithFal({
 *   prompt: "A beautiful sunset over mountains",
 *   apiKey: env.FAL_API_KEY,
 *   imageSize: "landscape_16_9",
 *   numInferenceSteps: 50
 * });
 *
 * if (result.success) {
 *   console.log("Image URL:", result.imageUrl);
 * }
 * ```
 */
export async function generateImageWithFal(
    params: GenerateImageParams,
): Promise<GenerateImageResult> {
    const {
        prompt,
        apiKey,
        imageSize = "square_hd",
        numInferenceSteps = 28,
        enableSafetyChecker = true,
    } = params;

    // Validation
    if (!apiKey || apiKey.trim().length === 0) {
        return {
            success: false,
            error: "FAL API key is required",
        };
    }

    if (!prompt || prompt.trim().length === 0) {
        return {
            success: false,
            error: "Prompt is required",
        };
    }

    try {
        // Configure FAL client with API key
        fal.config({
            credentials: apiKey,
        });

        // Generate image using Google Imagen 4 model (fal-ai/imagen4/preview)
        // Note: Using type assertion because FAL AI's type definitions don't match actual API
        const result = (await fal.subscribe("fal-ai/imagen4/preview", {
            input: {
                prompt: prompt.trim(),
                // @ts-expect-error - image_size is supported by API but not in type definitions
                image_size: imageSize,
                num_inference_steps: numInferenceSteps,
                num_images: 1,
                enable_safety_checker: enableSafetyChecker,
            },
            logs: false, // Disable logs for cleaner output
        })) as unknown as {
            data: FalResponse | undefined;
            requestId: string;
        };

        // Extract image data
        const images = result.data?.images;

        if (!images || images.length === 0) {
            return {
                success: false,
                error: "No image generated",
                requestId: result.requestId,
            };
        }

        const firstImage = images[0];

        return {
            success: true,
            imageUrl: firstImage.url,
            width: firstImage.width,
            height: firstImage.height,
            requestId: result.requestId,
        };
    } catch (error) {
        console.error("[fal-image-generator] Error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Image generation failed",
        };
    }
}
