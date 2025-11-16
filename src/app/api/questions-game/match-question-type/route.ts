import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type {
    QuestionTypeMatch,
    GenerateQuestionRequest,
} from "@/types/questions";

// Zod schema for AI response validation
const questionTypeMatchSchema = z.object({
    recommendedType: z.enum([
        "clue",
        "fill-blank",
        "guess-image",
        "event-order",
        "none",
        "multiple",
    ]),
    confidence: z.number().min(0).max(1),
    alternativeTypes: z.array(z.string()).optional(),
    reason: z.string(),
});

// Generate prompt for Claude
const getMatchPrompt = (knowledgePoint: string, language: "zh" | "en") => {
    if (language === "zh") {
        return `你是一个游戏化学习专家。请分析知识点"${knowledgePoint}"，并推荐最合适的题型。

可用题型：
1. **clue**（线索题）- 适用于：人物、地点、概念、发明等需要逐步揭示特征的知识点
2. **fill-blank**（填空题）- 适用于：公式、定义、时间、名称等需要精确填写的知识点
3. **guess-image**（看图猜X）- 适用于：具体事物、标志性场景、视觉特征明显的知识点
4. **event-order**（事件排序）- 适用于：历史事件、流程步骤、发展阶段等有明确时间顺序的知识点
5. **none** - 知识点过于抽象或不适合任何题型
6. **multiple** - 适合多种题型

分析要点：
- 知识点的类型（人物/事件/概念/公式/地点等）
- 知识点的特征（视觉化/时间性/结构化/抽象性）
- 学习目标（记忆/理解/应用）
- 游戏化适配度

输出要求：
- recommendedType: 推荐的题型
- confidence: 置信度（0-1之间，表示推荐的确定性）
- alternativeTypes: 可选的备选题型数组
- reason: 推荐理由（50字以内）

示例：
知识点："爱迪生"
{
  "recommendedType": "clue",
  "confidence": 0.95,
  "alternativeTypes": ["fill-blank", "guess-image"],
  "reason": "人物类知识点适合通过线索逐步揭示特征，趣味性强且符合猜谜机制"
}

知识点："牛顿第二定律"
{
  "recommendedType": "fill-blank",
  "confidence": 0.90,
  "alternativeTypes": ["clue"],
  "reason": "公式类知识点需要精确记忆，填空题能有效测试公式和关键术语"
}

知识点："中国近代史重大事件"
{
  "recommendedType": "event-order",
  "confidence": 0.95,
  "alternativeTypes": [],
  "reason": "历史事件具有明确的时间顺序，排序题能有效训练历史时间线记忆"
}

知识点："爱"
{
  "recommendedType": "none",
  "confidence": 0.85,
  "alternativeTypes": [],
  "reason": "过于抽象，难以转化为具体的游戏化题目"
}

现在请分析知识点"${knowledgePoint}"：`;
    }

    return `You are a gamification learning expert. Analyze the knowledge point "${knowledgePoint}" and recommend the most suitable question type.

Available types:
1. **clue** - For persons, places, concepts that benefit from gradual revelation
2. **fill-blank** - For formulas, definitions, precise facts
3. **guess-image** - For visual subjects, iconic scenes
4. **event-order** - For historical events, processes with clear chronology
5. **none** - Too abstract or unsuitable
6. **multiple** - Suitable for multiple types

Analyze: "${knowledgePoint}"`;
};

export async function POST(request: NextRequest) {
    try {
        const body: GenerateQuestionRequest = await request.json();
        const { knowledgePoint, language = "zh" } = body;

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

        // Match question type using AI
        const prompt = getMatchPrompt(knowledgePoint, language);

        console.log(
            "[match-question-type] Analyzing knowledge point:",
            knowledgePoint,
        );

        const result = await generateObject({
            model: gateway("anthropic/claude-sonnet-4"),
            schema: questionTypeMatchSchema,
            prompt,
        });

        const matchResult: QuestionTypeMatch = {
            knowledgePoint,
            ...result.object,
        };

        console.log(
            "[match-question-type] Match result:",
            matchResult.recommendedType,
        );
        console.log(
            "[match-question-type] Confidence:",
            matchResult.confidence,
        );
        console.log(
            "[match-question-type] Usage:",
            JSON.stringify(result.usage, null, 2),
        );

        return NextResponse.json({
            success: true,
            data: matchResult,
        });
    } catch (error) {
        console.error("[match-question-type] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "匹配失败，请稍后重试",
            },
            { status: 500 },
        );
    }
}
