import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type { Question } from "@/types/questions";

// Request body schema
const batchGenerateRequestSchema = z.object({
    topic: z.string().min(1),
    count: z.number().min(1).max(20).default(10),
    difficulty: z.enum(["1", "2", "3"]).optional(),
    language: z.enum(["zh", "en"]).default("zh"),
});

// Zod schema for AI response validation - knowledge points extraction
const knowledgePointsSchema = z.object({
    points: z
        .array(
            z.object({
                knowledgePoint: z.string(),
                suggestedType: z.enum([
                    "clue",
                    "fill-blank",
                    "guess-image",
                    "event-order",
                ]),
                difficulty: z.enum(["1", "2", "3"]),
            }),
        )
        .min(1)
        .max(20),
});

// Generate prompt for extracting knowledge points
const getExtractPrompt = (
    topic: string,
    count: number,
    language: "zh" | "en",
) => {
    if (language === "zh") {
        return `你是一个游戏化学习专家。请从主题"${topic}"中提取 ${count} 个适合转化为游戏题目的知识点。

要求：
- 知识点应该具体、明确，避免过于抽象
- 涵盖该主题的不同方面（人物、事件、概念、公式等）
- 难度分布合理（简单、中等、困难各占一定比例）
- 每个知识点都要推荐最合适的题型

可用题型：
- clue: 线索题（适合人物、概念、发明等）
- fill-blank: 填空题（适合公式、定义、时间等）
- guess-image: 看图猜X（适合具体事物、场景等）
- event-order: 事件排序（适合历史事件、流程步骤等）

输出格式：
- points: 知识点数组，每个包含：
  - knowledgePoint: 知识点名称
  - suggestedType: 推荐的题型
  - difficulty: 难度级别（1=简单, 2=中等, 3=困难）

示例（主题：中国近代史）：
{
  "points": [
    {
      "knowledgePoint": "孙中山",
      "suggestedType": "clue",
      "difficulty": "2"
    },
    {
      "knowledgePoint": "辛亥革命发生的年份",
      "suggestedType": "fill-blank",
      "difficulty": "1"
    },
    {
      "knowledgePoint": "五四运动、辛亥革命、新中国成立",
      "suggestedType": "event-order",
      "difficulty": "2"
    }
  ]
}

现在请从主题"${topic}"中提取 ${count} 个知识点：`;
    }

    return `You are a gamification learning expert. Extract ${count} knowledge points from the topic "${topic}" that are suitable for quiz games.

Requirements:
- Points should be specific and concrete
- Cover different aspects of the topic
- Balanced difficulty distribution
- Recommend appropriate question type for each

Extract ${count} knowledge points from "${topic}":`;
};

export async function POST(request: NextRequest) {
    try {
        const body = batchGenerateRequestSchema.parse(await request.json());
        const { topic, count, difficulty, language } = body;

        // Get Cloudflare context and AI Gateway
        const { env } = await getCloudflareContext();
        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });

        console.log("[batch-generate] Topic:", topic);
        console.log("[batch-generate] Count:", count);

        // Step 1: Extract knowledge points from topic
        const extractPrompt = getExtractPrompt(topic, count, language);

        const extractResult = await generateObject({
            model: gateway("anthropic/claude-sonnet-4"),
            schema: knowledgePointsSchema,
            prompt: extractPrompt,
        });

        const knowledgePoints = extractResult.object.points;
        console.log(
            "[batch-generate] Extracted knowledge points:",
            knowledgePoints.length,
        );

        // Step 2: Generate questions for each knowledge point
        const questions: Question[] = [];
        const errors: Array<{ knowledgePoint: string; error: string }> = [];

        for (const point of knowledgePoints) {
            try {
                const finalDifficulty =
                    difficulty || (point.difficulty as "1" | "2" | "3");
                const apiPath = `/api/questions-game/generate-${point.suggestedType}`;

                // Call the appropriate generation API
                const response = await fetch(
                    new URL(apiPath, request.url).toString(),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            knowledgePoint: point.knowledgePoint,
                            difficulty: Number.parseInt(finalDifficulty, 10),
                            language,
                        }),
                    },
                );

                if (response.ok) {
                    const result = (await response.json()) as {
                        success: boolean;
                        data?: Question;
                        error?: string;
                    };
                    if (result.success && result.data) {
                        questions.push(result.data);
                        console.log(
                            `[batch-generate] Generated ${point.suggestedType} for: ${point.knowledgePoint}`,
                        );
                    } else {
                        errors.push({
                            knowledgePoint: point.knowledgePoint,
                            error: result.error || "Generation failed",
                        });
                    }
                } else {
                    errors.push({
                        knowledgePoint: point.knowledgePoint,
                        error: `HTTP ${response.status}`,
                    });
                }

                // Add delay between requests to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
                errors.push({
                    knowledgePoint: point.knowledgePoint,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                });
            }
        }

        console.log(
            "[batch-generate] Successfully generated:",
            questions.length,
        );
        console.log("[batch-generate] Errors:", errors.length);

        return NextResponse.json({
            success: true,
            data: {
                topic,
                questions,
                errors: errors.length > 0 ? errors : undefined,
                summary: {
                    requested: count,
                    generated: questions.length,
                    failed: errors.length,
                },
            },
        });
    } catch (error) {
        console.error("[batch-generate] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "批量生成失败，请稍后重试",
            },
            { status: 500 },
        );
    }
}
