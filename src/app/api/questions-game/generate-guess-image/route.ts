import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type {
    GuessImageQuestion,
    GenerateGuessImageRequest,
} from "@/types/questions";
import { generateImageWithFal } from "@/lib/fal-image-generator";

// Zod schema for AI response validation
const guessImageQuestionSchema = z.object({
    imagePrompt: z.string(), // 用于生成图片的 prompt
    imageDescription: z.string(), // 图片的文字描述（作为备用）
    guessType: z.enum(["movie", "person", "place", "object", "other"]),
    answer: z.string(),
    tags: z.array(z.string()),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

// Generate prompt for Claude
const getGuessImagePrompt = (
    knowledgePoint: string,
    difficulty: 1 | 2 | 3,
    language: "zh" | "en",
    guessType?: string,
) => {
    const difficultyMap = {
        1: { desc: "简单", hintsCount: "2-3" },
        2: { desc: "中等", hintsCount: "1-2" },
        3: { desc: "困难", hintsCount: "0-1" },
    };

    const config = difficultyMap[difficulty];

    if (language === "zh") {
        return `你是一个游戏化学习专家。请为知识点"${knowledgePoint}"设计一道"看图猜X"题。

我们会使用 AI 图片生成模型（FLUX.1）来生成图片，所以你需要提供：
1. imagePrompt: 用于生成图片的英文 prompt（详细的视觉描述，符合 Stable Diffusion/FLUX 的 prompt 格式）
2. imageDescription: 图片的中文描述（作为用户看到图片后的提示）

要求：
- 难度：${config.desc}
- 提示数量：${config.hintsCount}条
${guessType ? `- 猜测类型：${guessType}` : "- 请根据知识点自动判断猜测类型（movie/person/place/object/other）"}
- imagePrompt 要详细、具体、符合 FLUX 图片生成模型的格式（英文，包含风格、光线、细节等）
- imagePrompt 不要直接提及答案本身，但要有足够的视觉线索
- imageDescription 是对图片的简短中文描述（让用户知道图片想表达什么）

输出要求：
- imagePrompt: 用于生成图片的英文 prompt（详细、符合 FLUX 格式）
- imageDescription: 图片的中文描述
- guessType: 猜测类型（movie/person/place/object/other）
- answer: 正确答案
- tags: 相关标签数组
- hints: （可选）额外提示数组
- explanation: （可选）答案解析

示例（电影：盗梦空间）：
{
  "imagePrompt": "A man in a black suit standing on a city street, dramatic perspective distortion with buildings bending upwards and folding like paper, defying gravity, broken glass shards floating in mid-air, chaotic modern cityscape in background, surreal atmosphere, cinematic lighting, photorealistic style, 8k quality",
  "imageDescription": "一个穿西装的男子站在扭曲弯折的城市街道上",
  "guessType": "movie",
  "answer": "盗梦空间",
  "tags": ["电影", "科幻", "悬疑"],
  "hints": ["提示：导演是克里斯托弗·诺兰", "提示：主演是莱昂纳多·迪卡普里奥"],
  "explanation": "《盗梦空间》是2010年上映的科幻电影，以梦境层级和潜意识为主题"
}

现在请为"${knowledgePoint}"生成看图猜X题：`;
    }

    return `You are a gamification learning expert. Create a "guess from image" quiz for: "${knowledgePoint}".

We will use AI image generation (FLUX.1) to create the image, so provide:
1. imagePrompt: Detailed English prompt for image generation (FLUX/Stable Diffusion format)
2. imageDescription: Brief description of what the image shows

Requirements:
- Difficulty: ${config.desc}
- Hints count: ${config.hintsCount}
${guessType ? `- Guess type: ${guessType}` : "- Auto-detect guess type (movie/person/place/object/other)"}
- imagePrompt should be detailed, specific, in proper FLUX format (include style, lighting, details)
- imagePrompt should NOT directly mention the answer, but have sufficient visual clues
- imageDescription is a brief description of the image content

Output schema:
- imagePrompt: Detailed English prompt for FLUX image generation
- imageDescription: Brief description
- guessType: Type (movie/person/place/object/other)
- answer: Correct answer
- tags: Array of tags
- hints: (optional) Array of hints
- explanation: (optional) Answer explanation

Now generate quiz for "${knowledgePoint}":`;
};

export async function POST(request: NextRequest) {
    try {
        const body: GenerateGuessImageRequest = await request.json();
        const {
            knowledgePoint,
            difficulty = 2,
            language = "zh",
            guessType,
        } = body;

        // Validation
        if (!knowledgePoint || knowledgePoint.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "知识点不能为空" },
                { status: 400 },
            );
        }

        // Get Cloudflare context and AI Gateway
        const { env } = getCloudflareContext();
        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });

        // Generate guess-image question using AI
        const prompt = getGuessImagePrompt(
            knowledgePoint,
            difficulty,
            language,
            guessType,
        );

        console.log(
            "[generate-guess-image] Generating question for:",
            knowledgePoint,
        );
        console.log("[generate-guess-image] Difficulty:", difficulty);

        const result = await generateObject({
            model: gateway("anthropic/claude-sonnet-4"),
            schema: guessImageQuestionSchema,
            prompt,
        });

        const generatedData = result.object;

        console.log(
            "[generate-guess-image] AI generation successful, now generating image...",
        );
        console.log(
            "[generate-guess-image] Image prompt:",
            generatedData.imagePrompt,
        );

        // Generate actual image using FAL AI
        let imageUrl: string | undefined;
        const falApiKey = env.FAL_API_KEY;

        if (falApiKey) {
            const imageResult = await generateImageWithFal({
                prompt: generatedData.imagePrompt,
                apiKey: falApiKey,
                imageSize: "landscape_16_9", // Good for quiz images
                numInferenceSteps: 28,
            });

            if (imageResult.success && imageResult.imageUrl) {
                imageUrl = imageResult.imageUrl;
                console.log(
                    "[generate-guess-image] Image generated:",
                    imageUrl,
                );
            } else {
                console.warn(
                    "[generate-guess-image] Image generation failed, using description fallback:",
                    imageResult.error,
                );
            }
        } else {
            console.warn(
                "[generate-guess-image] FAL_API_KEY not found, using description fallback",
            );
        }

        // Construct response
        const guessImageQuestion: GuessImageQuestion = {
            id: `guess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: "guess-image",
            knowledgePoint,
            difficulty,
            tags: generatedData.tags,
            imageUrl, // 真正的图片 URL
            imageDescription: generatedData.imageDescription, // 备用文字描述
            guessType: generatedData.guessType,
            answer: generatedData.answer,
            hints: generatedData.hints,
            explanation: generatedData.explanation,
        };

        console.log(
            "[generate-guess-image] Generated successfully:",
            guessImageQuestion.id,
        );
        console.log("[generate-guess-image] Has image URL:", Boolean(imageUrl));
        console.log(
            "[generate-guess-image] AI Usage:",
            JSON.stringify(result.usage, null, 2),
        );

        return NextResponse.json({
            success: true,
            data: guessImageQuestion,
        });
    } catch (error) {
        console.error("[generate-guess-image] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "生成失败，请稍后重试",
            },
            { status: 500 },
        );
    }
}
