import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import {
    type GenerationConfig,
    generationConfigSchema,
    type PipelineLog,
    knowledgeBreakdownSchema,
    clueQuestionSchema,
    fillBlankQuestionSchema,
    guessImageQuestionSchema,
    eventOrderQuestionSchema,
} from "@/modules/question-generator/models/question-generator.model";
import {
    getKnowledgeBreakdownPrompt,
    getQuestionGenerationPrompt,
} from "@/modules/question-generator/utils/ai-prompts";
import { generateImageWithFal } from "@/lib/fal-image-generator";

function getSchemaForQuestionType(type: string) {
    switch (type) {
        case "clue":
            return clueQuestionSchema;
        case "fill-blank":
            return fillBlankQuestionSchema;
        case "guess-image":
            return guessImageQuestionSchema;
        case "event-order":
            return eventOrderQuestionSchema;
        default:
            throw new Error(`Unknown question type: ${type}`);
    }
}

/**
 * Streaming API for real-time question generation with logs
 */
export async function POST(request: Request) {
    const encoder = new TextEncoder();

    // Create a readable stream
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const body = await request.json();
                const config = generationConfigSchema.parse(body);

                const startTime = Date.now();

                // Helper to send log
                const sendLog = (log: PipelineLog) => {
                    const data = `data: ${JSON.stringify(log)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                };

                // Step 1: Validate config
                sendLog({
                    step: "配置验证",
                    status: "running",
                    timestamp: Date.now(),
                    details: {
                        input: config.knowledgePoint,
                        difficulty: config.difficulty,
                        includeTypes: config.includeTypes,
                    },
                });

                await new Promise((resolve) => setTimeout(resolve, 100));

                sendLog({
                    step: "配置验证",
                    status: "success",
                    timestamp: Date.now(),
                    duration: Date.now() - startTime,
                });

                // Step 2: Knowledge breakdown
                const breakdownStartTime = Date.now();
                const prompt = getKnowledgeBreakdownPrompt(
                    config.knowledgePoint,
                );

                sendLog({
                    step: "知识点拆解",
                    status: "running",
                    timestamp: Date.now(),
                    details: {
                        knowledgePoint: config.knowledgePoint,
                    },
                    prompt, // 发送完整的 prompt
                });

                const { env } = getCloudflareContext();
                const gateway = createGateway({
                    apiKey: env.AI_GATEWAY_API_KEY || "",
                });

                const breakdownResult = await generateObject({
                    model: gateway("azure/gpt-4o"),
                    schema: knowledgeBreakdownSchema,
                    prompt,
                });

                const breakdown = breakdownResult.object;

                sendLog({
                    step: "知识点拆解",
                    status: "success",
                    timestamp: Date.now(),
                    duration: Date.now() - breakdownStartTime,
                    details: {
                        totalPoints: breakdown.totalPoints,
                        mainCategory: breakdown.mainCategory,
                        breakdown: breakdown.breakdown.map((p) => ({
                            name: p.name,
                            category: p.category,
                            recommendedTypes: p.recommendedTypes,
                            difficulty: p.difficulty,
                        })),
                    },
                    response: breakdown, // 发送完整的 AI 响应
                });

                // Step 3: Generate questions
                const questionGenerationStartTime = Date.now();

                sendLog({
                    step: "题目生成",
                    status: "running",
                    timestamp: Date.now(),
                    details: { totalPoints: breakdown.totalPoints },
                });

                const questions = [];
                const questionsWithMetadata = [];
                let questionIndex = 0;

                for (const point of breakdown.breakdown) {
                    const typesToGenerate = config.includeTypes
                        ? point.recommendedTypes.filter((type) =>
                              config.includeTypes?.includes(type),
                          )
                        : point.recommendedTypes;

                    for (const type of typesToGenerate) {
                        questionIndex++;

                        // Send progress log for each question
                        const questionPrompt = getQuestionGenerationPrompt(
                            {
                                name: point.name,
                                category: point.category,
                                description: point.description,
                                difficulty:
                                    point.difficulty || config.difficulty,
                            },
                            type,
                        );

                        sendLog({
                            step: `生成题目 ${questionIndex}`,
                            status: "running",
                            timestamp: Date.now(),
                            details: {
                                knowledgePoint: point.name,
                                questionType: type,
                            },
                            prompt: questionPrompt,
                        });

                        try {
                            const schema = getSchemaForQuestionType(type);
                            const result = await generateObject({
                                model: gateway("azure/gpt-4o"),
                                schema,
                                prompt: questionPrompt,
                            });

                            const questionData = result.object;

                            // Generate image if needed
                            if (
                                type === "guess-image" &&
                                questionData &&
                                "imagePrompt" in questionData
                            ) {
                                sendLog({
                                    step: `生成图片 ${questionIndex}`,
                                    status: "running",
                                    timestamp: Date.now(),
                                    details: {
                                        imagePrompt: questionData.imagePrompt,
                                    },
                                });

                                const imageResult = await generateImageWithFal({
                                    prompt:
                                        questionData.imagePrompt ||
                                        questionData.description,
                                    apiKey: env.FAL_API_KEY || "",
                                    imageSize: "landscape_16_9",
                                    numInferenceSteps: 50,
                                });

                                if (
                                    imageResult.success &&
                                    imageResult.imageUrl
                                ) {
                                    questionData.imageUrl =
                                        imageResult.imageUrl;

                                    sendLog({
                                        step: `生成图片 ${questionIndex}`,
                                        status: "success",
                                        timestamp: Date.now(),
                                        details: {
                                            imageUrl: imageResult.imageUrl,
                                        },
                                    });
                                } else {
                                    sendLog({
                                        step: `生成图片 ${questionIndex}`,
                                        status: "error",
                                        timestamp: Date.now(),
                                        error: imageResult.error,
                                    });
                                }
                            }

                            questions.push(questionData);

                            // Store with metadata
                            questionsWithMetadata.push({
                                question: questionData,
                                metadata: {
                                    prompt: questionPrompt,
                                    generatedAt: Date.now(),
                                    knowledgePoint: point.name,
                                },
                            });

                            sendLog({
                                step: `生成题目 ${questionIndex}`,
                                status: "success",
                                timestamp: Date.now(),
                                response: questionData,
                            });
                        } catch (error) {
                            sendLog({
                                step: `生成题目 ${questionIndex}`,
                                status: "error",
                                timestamp: Date.now(),
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                            });
                        }
                    }
                }

                const questionsByType = questions.reduce<
                    Record<string, number>
                >((acc, q) => {
                    const type = (q as { type: string }).type;
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {});

                sendLog({
                    step: "题目生成",
                    status: "success",
                    timestamp: Date.now(),
                    duration: Date.now() - questionGenerationStartTime,
                    details: {
                        totalGenerated: questions.length,
                        questionsByType,
                    },
                });

                // Final result
                sendLog({
                    step: "完成",
                    status: "success",
                    timestamp: Date.now(),
                    details: {
                        totalTime: Date.now() - startTime,
                        totalQuestions: questions.length,
                        result: {
                            knowledgeBreakdown: breakdown,
                            questions,
                            questionsWithMetadata,
                            totalGenerated: questions.length,
                            generationTime: Date.now() - startTime,
                        },
                    },
                });

                controller.close();
            } catch (error) {
                const errorLog: PipelineLog = {
                    step: "错误",
                    status: "error",
                    timestamp: Date.now(),
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                };

                const data = `data: ${JSON.stringify(errorLog)}\n\n`;
                controller.enqueue(encoder.encode(data));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
