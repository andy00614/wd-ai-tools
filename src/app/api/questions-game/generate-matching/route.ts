import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type {
    MatchingQuestion,
    GenerateMatchingRequest,
} from "@/types/questions";

// Zod schema for AI response validation
const matchingQuestionSchema = z.object({
    leftItems: z
        .array(
            z.object({
                id: z.string(),
                content: z.string(),
            }),
        )
        .min(3)
        .max(6),
    rightItems: z
        .array(
            z.object({
                id: z.string(),
                content: z.string(),
            }),
        )
        .min(3)
        .max(6),
    correctPairs: z.array(
        z.object({
            leftId: z.string(),
            rightId: z.string(),
        }),
    ),
    tags: z.array(z.string()),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

// Generate prompt for Claude
const getMatchingPrompt = (
    knowledgePoint: string,
    difficulty: 1 | 2 | 3,
    language: "zh" | "en",
) => {
    const difficultyMap = {
        1: {
            pairs: "3-4",
            desc: "简单",
            style: "直接对应关系，容易识别",
        },
        2: {
            pairs: "4-5",
            desc: "中等",
            style: "需要一定知识储备，有一定混淆度",
        },
        3: {
            pairs: "5-6",
            desc: "困难",
            style: "复杂对应关系，需要深入理解",
        },
    };

    const config = difficultyMap[difficulty];

    if (language === "zh") {
        return `你是一个游戏化学习专家。请为知识点"${knowledgePoint}"设计一道配对题。

要求：
- 难度：${config.desc}
- 配对数量：${config.pairs}对
- 配对风格：${config.style}
- 左侧项和右侧项要有清晰的对应关系
- 常见的配对类型：
  * 人物 ↔ 成就/事件
  * 概念 ↔ 定义
  * 国家/地点 ↔ 特征/首都
  * 发明 ↔ 发明家
  * 事件 ↔ 时间/结果
- 配对应该有一定难度，避免过于简单或显而易见
- ID 格式：left-1, left-2... 和 right-1, right-2...

输出要求：
- leftItems: 左侧项数组，每项包含 id 和 content
- rightItems: 右侧项数组，每项包含 id 和 content
- correctPairs: 正确配对数组，每项包含 leftId 和 rightId
- tags: 相关标签数组（如：历史、地理、科学等）
- hints: （可选）提示数组，帮助用户理解配对关系
- explanation: （可选）配对关系的详细解析

示例（中国历史人物与成就）：
{
  "leftItems": [
    { "id": "left-1", "content": "秦始皇" },
    { "id": "left-2", "content": "汉武帝" },
    { "id": "left-3", "content": "唐太宗" }
  ],
  "rightItems": [
    { "id": "right-1", "content": "统一六国，建立郡县制" },
    { "id": "right-2", "content": "独尊儒术，开拓丝绸之路" },
    { "id": "right-3", "content": "贞观之治，开创盛世" }
  ],
  "correctPairs": [
    { "leftId": "left-1", "rightId": "right-1" },
    { "leftId": "left-2", "rightId": "right-2" },
    { "leftId": "left-3", "rightId": "right-3" }
  ],
  "tags": ["历史", "中国", "人物"],
  "hints": ["按照时间顺序思考"],
  "explanation": "秦始皇（前221-前210年）统一六国并建立郡县制；汉武帝（前141-前87年）独尊儒术并开拓丝绸之路；唐太宗（626-649年）开创贞观之治。"
}

现在请为"${knowledgePoint}"生成配对题：`;
    }

    return `You are a gamification learning expert. Create a matching quiz for the knowledge point: "${knowledgePoint}".

Requirements:
- Difficulty: ${config.desc}
- Number of pairs: ${config.pairs}
- Matching style: ${config.style}
- Left and right items should have clear correspondence
- Common matching types:
  * Person ↔ Achievement/Event
  * Concept ↔ Definition
  * Country/Place ↔ Feature/Capital
  * Invention ↔ Inventor
  * Event ↔ Time/Result
- Matching should have appropriate difficulty, avoid being too obvious
- ID format: left-1, left-2... and right-1, right-2...

Output format:
- leftItems: Array of left items, each with id and content
- rightItems: Array of right items, each with id and content
- correctPairs: Array of correct pairs, each with leftId and rightId
- tags: Related tags array (e.g., history, geography, science)
- hints: (Optional) Hints array to help understand the relationships
- explanation: (Optional) Detailed explanation of the matching relationships

Now generate a matching quiz for "${knowledgePoint}":`;
};

export async function POST(request: NextRequest) {
    try {
        const body: GenerateMatchingRequest = await request.json();
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

        // Generate matching question using AI
        const prompt = getMatchingPrompt(knowledgePoint, difficulty, language);

        console.log(
            "[generate-matching] Generating matching question for:",
            knowledgePoint,
        );
        console.log("[generate-matching] Difficulty:", difficulty);
        console.log("[generate-matching] Language:", language);

        const result = await generateObject({
            model: gateway("anthropic/claude-sonnet-4"),
            schema: matchingQuestionSchema,
            prompt,
        });

        const generatedData = result.object;

        // Construct response
        const matchingQuestion: MatchingQuestion = {
            id: `matching_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: "matching",
            knowledgePoint,
            difficulty,
            tags: generatedData.tags,
            leftItems: generatedData.leftItems,
            rightItems: generatedData.rightItems,
            correctPairs: generatedData.correctPairs,
            hints: generatedData.hints,
            explanation: generatedData.explanation,
        };

        console.log(
            "[generate-matching] Generated successfully:",
            matchingQuestion.id,
        );
        console.log(
            "[generate-matching] Usage:",
            JSON.stringify(result.usage, null, 2),
        );

        return NextResponse.json({
            success: true,
            data: matchingQuestion,
        });
    } catch (error) {
        console.error("[generate-matching] Error:", error);
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
