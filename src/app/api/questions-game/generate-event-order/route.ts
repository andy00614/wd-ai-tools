import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type {
    EventOrderQuestion,
    GenerateEventOrderRequest,
} from "@/types/questions";

// Zod schema for AI response validation
const eventOrderQuestionSchema = z.object({
    events: z
        .array(
            z.object({
                id: z.string(),
                description: z.string(),
                date: z.string().optional(),
            }),
        )
        .min(3)
        .max(8),
    correctOrder: z.array(z.string()),
    tags: z.array(z.string()),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

// Generate prompt for Claude
const getEventOrderPrompt = (
    knowledgePoint: string,
    difficulty: 1 | 2 | 3,
    language: "zh" | "en",
) => {
    const difficultyMap = {
        1: { events: "3-4", desc: "简单", dateHints: true },
        2: { events: "4-6", desc: "中等", dateHints: true },
        3: { events: "5-8", desc: "困难", dateHints: false },
    };

    const config = difficultyMap[difficulty];

    if (language === "zh") {
        return `你是一个游戏化学习专家。请为知识点"${knowledgePoint}"设计一道事件排序题。

要求：
- 难度：${config.desc}
- 事件数量：${config.events}个
- 是否提供时间提示：${config.dateHints ? "是（提供年份或大致时间）" : "否（仅描述事件）"}
- 每个事件应该有清晰的时间先后关系
- 事件描述应该简洁明了，但不要包含明显的时间顺序词汇

输出要求：
- events: 事件数组，每个包含：
  - id: 唯一标识符（使用 event_1, event_2 等）
  - description: 事件描述
  - date: （可选）时间信息
- correctOrder: 正确的事件ID顺序数组
- tags: 相关标签数组
- hints: （可选）额外提示数组
- explanation: （可选）答案解析

示例（中国近代史）：
{
  "events": [
    {
      "id": "event_1",
      "description": "辛亥革命推翻清朝统治",
      "date": "1911年"
    },
    {
      "id": "event_2",
      "description": "五四运动爆发",
      "date": "1919年"
    },
    {
      "id": "event_3",
      "description": "中国共产党成立",
      "date": "1921年"
    },
    {
      "id": "event_4",
      "description": "中华人民共和国成立",
      "date": "1949年"
    }
  ],
  "correctOrder": ["event_1", "event_2", "event_3", "event_4"],
  "tags": ["历史", "中国近代史", "重大事件"],
  "hints": ["提示：从清朝末期到新中国成立"],
  "explanation": "这些事件标志着中国从封建王朝到社会主义国家的转变"
}

现在请为"${knowledgePoint}"生成事件排序题：`;
    }

    return `You are a gamification learning expert. Create an event ordering quiz for: "${knowledgePoint}".

Requirements:
- Difficulty: ${config.desc}
- Number of events: ${config.events}
- Events should have clear chronological relationships
- Descriptions should be concise

Now generate an event-order quiz for "${knowledgePoint}":`;
};

export async function POST(request: NextRequest) {
    try {
        const body: GenerateEventOrderRequest = await request.json();
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

        // Generate event-order question using AI
        const prompt = getEventOrderPrompt(
            knowledgePoint,
            difficulty,
            language,
        );

        console.log(
            "[generate-event-order] Generating question for:",
            knowledgePoint,
        );
        console.log("[generate-event-order] Difficulty:", difficulty);

        const result = await generateObject({
            model: gateway("anthropic/claude-sonnet-4"),
            schema: eventOrderQuestionSchema,
            prompt,
        });

        const generatedData = result.object;

        // Construct response
        const eventOrderQuestion: EventOrderQuestion = {
            id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: "event-order",
            knowledgePoint,
            difficulty,
            tags: generatedData.tags,
            events: generatedData.events,
            correctOrder: generatedData.correctOrder,
            hints: generatedData.hints,
            explanation: generatedData.explanation,
        };

        console.log(
            "[generate-event-order] Generated successfully:",
            eventOrderQuestion.id,
        );
        console.log(
            "[generate-event-order] Usage:",
            JSON.stringify(result.usage, null, 2),
        );

        return NextResponse.json({
            success: true,
            data: eventOrderQuestion,
        });
    } catch (error) {
        console.error("[generate-event-order] Error:", error);
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
