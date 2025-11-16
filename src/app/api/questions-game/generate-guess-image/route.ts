import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type {
    GuessImageQuestion,
    GenerateGuessImageRequest,
} from "@/types/questions";

// Zod schema for AI response validation
const guessImageQuestionSchema = z.object({
    imageDescription: z.string(), // Phase 1: 使用文字描述代替图片
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

注意：目前是 Phase 1 阶段，暂无图片生成功能，请使用文字描述代替图片。

要求：
- 难度：${config.desc}
- 提示数量：${config.hintsCount}条
${guessType ? `- 猜测类型：${guessType}` : "- 请根据知识点自动判断猜测类型（movie/person/place/object/other）"}
- 文字描述应该生动、具体，让用户能"脑补"出画面
- 描述不要直接说出答案，但要有足够的视觉特征

输出要求：
- imageDescription: 详细的视觉描述（代替图片）
- guessType: 猜测类型（movie/person/place/object/other）
- answer: 正确答案
- tags: 相关标签数组
- hints: （可选）额外提示数组
- explanation: （可选）答案解析

示例（电影：盗梦空间）：
{
  "imageDescription": "一个穿着西装的男子站在城市街道上，但整个城市的建筑开始向上弯曲，街道像纸张一样折叠，重力似乎失效了。天空中漂浮着破碎的玻璃碎片，背景是一片混乱的现代都市。男子神情冷静，似乎对这一切习以为常。",
  "guessType": "movie",
  "answer": "盗梦空间",
  "tags": ["电影", "科幻", "悬疑"],
  "hints": ["提示：导演是克里斯托弗·诺兰", "提示：主演是莱昂纳多·迪卡普里奥"],
  "explanation": "《盗梦空间》是2010年上映的科幻电影，以梦境层级和潜意识为主题"
}

现在请为"${knowledgePoint}"生成看图猜X题：`;
    }

    return `You are a gamification learning expert. Create a "guess from image" quiz for: "${knowledgePoint}".

Note: This is Phase 1 - no image generation yet, use text description instead.

Requirements:
- Difficulty: ${config.desc}
- Visual description should be vivid and specific
- Don't reveal the answer directly

Now generate a guess-image quiz for "${knowledgePoint}":`;
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
        const { env } = await getCloudflareContext();
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

        // Construct response
        const guessImageQuestion: GuessImageQuestion = {
            id: `guess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: "guess-image",
            knowledgePoint,
            difficulty,
            tags: generatedData.tags,
            imageDescription: generatedData.imageDescription,
            guessType: generatedData.guessType,
            answer: generatedData.answer,
            hints: generatedData.hints,
            explanation: generatedData.explanation,
        };

        console.log(
            "[generate-guess-image] Generated successfully:",
            guessImageQuestion.id,
        );
        console.log(
            "[generate-guess-image] Usage:",
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
