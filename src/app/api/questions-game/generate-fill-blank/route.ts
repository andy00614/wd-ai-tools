import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type {
    FillBlankQuestion,
    GenerateFillBlankRequest,
} from "@/types/questions";

// Zod schema for AI response validation
const fillBlankQuestionSchema = z.object({
    sentence: z.string(),
    blanks: z
        .array(
            z.object({
                position: z.number(),
                correctAnswer: z.string(),
                options: z.array(z.string()).optional(),
            }),
        )
        .min(1)
        .max(5),
    tags: z.array(z.string()),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

// Generate prompt for Claude
const getFillBlankPrompt = (
    knowledgePoint: string,
    difficulty: 1 | 2 | 3,
    language: "zh" | "en",
) => {
    const difficultyMap = {
        1: { blanks: "1-2", desc: "简单", hasOptions: true },
        2: { blanks: "2-3", desc: "中等", hasOptions: true },
        3: { blanks: "3-4", desc: "困难", hasOptions: false },
    };

    const config = difficultyMap[difficulty];

    if (language === "zh") {
        return `你是一个游戏化学习专家。请为知识点"${knowledgePoint}"设计一道填空题。

要求：
- 难度：${config.desc}
- 空白数量：${config.blanks}个
- 是否提供选项：${config.hasOptions ? "是（提供3-4个选项）" : "否（纯输入模式）"}
- 句子应该完整、流畅，用 ____ 表示空白位置
- 每个空白需要有明确的正确答案
- 如果提供选项，需要包含干扰项

输出要求：
- sentence: 完整的句子（使用____表示空白）
- blanks: 空白数组，每个包含：
  - position: 空白在句子中的位置索引（从0开始）
  - correctAnswer: 正确答案
  - options: 选项数组（包含正确答案和干扰项）
- tags: 相关标签数组
- hints: （可选）额外提示数组
- explanation: （可选）答案解析

示例（牛顿第二定律）：
{
  "sentence": "牛顿第____定律描述了力、质量和____之间的关系，公式为 F=____。",
  "blanks": [
    {
      "position": 0,
      "correctAnswer": "二",
      "options": ["一", "二", "三", "四"]
    },
    {
      "position": 1,
      "correctAnswer": "加速度",
      "options": ["速度", "加速度", "位移", "时间"]
    },
    {
      "position": 2,
      "correctAnswer": "ma",
      "options": ["ma", "mv", "mgh", "1/2mv²"]
    }
  ],
  "tags": ["物理", "牛顿定律", "经典力学"],
  "hints": ["提示：第二定律是最常用的力学定律"],
  "explanation": "牛顿第二定律是经典力学的基础，描述了力与加速度的关系"
}

现在请为"${knowledgePoint}"生成填空题：`;
    }

    return `You are a gamification learning expert. Create a fill-in-the-blank quiz for: "${knowledgePoint}".

Requirements:
- Difficulty: ${config.desc}
- Number of blanks: ${config.blanks}
- Provide options: ${config.hasOptions ? "Yes (3-4 options)" : "No (input mode)"}
- The sentence should be complete and fluent, use ____ for blanks
- Each blank needs a clear correct answer
- If options provided, include distractors

Now generate a fill-blank quiz for "${knowledgePoint}":`;
};

export async function POST(request: NextRequest) {
    try {
        const body: GenerateFillBlankRequest = await request.json();
        const { knowledgePoint, difficulty = 2, language = "zh" } = body;

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

        // Generate fill-blank question using AI
        const prompt = getFillBlankPrompt(knowledgePoint, difficulty, language);

        console.log(
            "[generate-fill-blank] Generating question for:",
            knowledgePoint,
        );
        console.log("[generate-fill-blank] Difficulty:", difficulty);

        const result = await generateObject({
            model: gateway("anthropic/claude-sonnet-4"),
            schema: fillBlankQuestionSchema,
            prompt,
        });

        const generatedData = result.object;

        // Construct response
        const fillBlankQuestion: FillBlankQuestion = {
            id: `fill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: "fill-blank",
            knowledgePoint,
            difficulty,
            tags: generatedData.tags,
            sentence: generatedData.sentence,
            blanks: generatedData.blanks,
            hints: generatedData.hints,
            explanation: generatedData.explanation,
        };

        console.log(
            "[generate-fill-blank] Generated successfully:",
            fillBlankQuestion.id,
        );
        console.log(
            "[generate-fill-blank] Usage:",
            JSON.stringify(result.usage, null, 2),
        );

        return NextResponse.json({
            success: true,
            data: fillBlankQuestion,
        });
    } catch (error) {
        console.error("[generate-fill-blank] Error:", error);
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
