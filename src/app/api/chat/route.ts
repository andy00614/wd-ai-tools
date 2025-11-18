import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
    createGateway,
    streamText,
    convertToModelMessages,
    type UIMessage,
    stepCountIs,
} from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

// Web Search Tool Schema
const webSearchToolSchema = z.object({
    query: z.string().describe("The search query to execute"),
});

// Tavily Web Search Implementation
async function searchWeb(
    query: string,
    apiKey: string,
): Promise<{
    sources: Array<{ title: string; url: string; snippet: string }>;
    summary: string;
}> {
    const searchStartTime = Date.now();

    try {
        console.log(`[webSearch] 🔍 Starting search for: "${query}"`);
        console.log("[webSearch] API key configured:", !!apiKey);

        if (!apiKey) {
            console.error(
                "[webSearch] ❌ No API key provided - TAVILY_API_KEY missing",
            );
            return {
                sources: [],
                summary:
                    "Web search is unavailable: TAVILY_API_KEY not configured.",
            };
        }

        // Initialize Tavily client
        const tavilyClient = tavily({ apiKey });
        console.log("[webSearch] ✅ Tavily client initialized");

        // Perform search
        console.log("[webSearch] 📡 Sending search request...");
        const response = await tavilyClient.search(query, {
            maxResults: 5,
            searchDepth: "basic", // or "advanced" for more thorough search
            includeAnswer: true, // Get AI-generated answer
        });

        const searchTime = Date.now() - searchStartTime;
        console.log(
            `[webSearch] ✅ Search completed in ${searchTime}ms - Found ${response.results.length} results`,
        );
        console.log(
            "[webSearch] Has answer:",
            !!response.answer,
            "Answer length:",
            response.answer?.length || 0,
        );

        // Format sources
        const sources = response.results.map((result, index) => {
            console.log(`[webSearch] Source ${index + 1}:`, {
                title: result.title.substring(0, 50),
                url: result.url,
                contentLength: result.content.length,
            });
            return {
                title: result.title,
                url: result.url,
                snippet: result.content,
            };
        });

        // Use Tavily's answer if available, otherwise create summary
        const summary =
            response.answer ||
            `Found ${sources.length} results for "${query}". ${sources[0]?.snippet || ""}`;

        console.log("[webSearch] 📊 Summary created, length:", summary.length);

        return { sources, summary };
    } catch (error) {
        const errorTime = Date.now() - searchStartTime;
        console.error(`[webSearch] ❌ Error after ${errorTime}ms:`, error);
        console.error("[webSearch] Error type:", error?.constructor?.name);
        console.error(
            "[webSearch] Error message:",
            error instanceof Error ? error.message : String(error),
        );
        console.error(
            "[webSearch] Error stack:",
            error instanceof Error ? error.stack : "No stack",
        );

        // Return error message but don't crash
        return {
            sources: [],
            summary: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}. Please check your TAVILY_API_KEY is configured.`,
        };
    }
}

// Allow streaming responses up to 30 seconds
// Note: This setting is for Vercel deployment. On Cloudflare Workers,
// the actual limit is controlled by wrangler.jsonc's limits.cpu_ms (30000ms)
export const maxDuration = 30;

// Helper to log with timestamp
function logWithTimestamp(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

export async function POST(request: Request) {
    logWithTimestamp("[chat] 🚀 Request received");

    try {
        // Log request headers for debugging
        const requestHeaders = Object.fromEntries(request.headers.entries());
        logWithTimestamp("[chat] 📋 Request headers", {
            contentType: requestHeaders["content-type"],
            origin: requestHeaders["origin"],
            userAgent: requestHeaders["user-agent"],
        });

        const body = (await request.json()) as {
            messages: UIMessage[];
            model?: string;
            enableWebSearch?: boolean;
            enableThinking?: boolean;
        };
        const {
            messages,
            model,
            enableWebSearch = false,
            enableThinking = true,
        } = body;

        logWithTimestamp("[chat] 📦 Request body parsed", {
            messagesCount: messages?.length,
            model,
            enableWebSearch,
            enableThinking,
            bodySize: JSON.stringify(body).length,
        });

        // Validate input
        if (!messages || !Array.isArray(messages)) {
            logWithTimestamp("[chat] ❌ Validation failed - invalid messages", {
                received: typeof messages,
                isArray: Array.isArray(messages),
            });
            return new Response(
                JSON.stringify({
                    error: "Messages array is required",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Default model if not provided (using faster model to avoid timeouts)
        const selectedModelId = model || "openai/gpt-4o-mini";
        logWithTimestamp("[chat] 🤖 Model selected", {
            requested: model,
            selected: selectedModelId,
        });

        // Get Cloudflare context and AI Gateway
        const contextStartTime = Date.now();
        const { env } = getCloudflareContext();
        logWithTimestamp("[chat] ☁️  Cloudflare context retrieved", {
            timeMs: Date.now() - contextStartTime,
            hasAIGatewayKey: !!env.AI_GATEWAY_API_KEY,
            hasTavilyKey: !!(env as any).TAVILY_API_KEY,
        });

        // Validate required environment variables
        if (!env.AI_GATEWAY_API_KEY) {
            logWithTimestamp(
                "[chat] ⚠️  WARNING: AI_GATEWAY_API_KEY not configured",
            );
        }

        if (enableWebSearch && !(env as any).TAVILY_API_KEY) {
            logWithTimestamp(
                "[chat] ⚠️  WARNING: TAVILY_API_KEY not configured but web search enabled",
            );
        }

        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });
        logWithTimestamp("[chat] 🌐 AI Gateway created");

        // Convert UIMessages to ModelMessages
        const conversionStartTime = Date.now();
        const modelMessages = convertToModelMessages(messages);
        logWithTimestamp("[chat] 🔄 Messages converted", {
            count: modelMessages.length,
            timeMs: Date.now() - conversionStartTime,
            firstMessageRole: modelMessages[0]?.role,
            lastMessageRole: modelMessages[modelMessages.length - 1]?.role,
        });

        // Determine provider-specific options for reasoning/thinking
        const providerOptions: Record<string, any> = {};

        // Only configure reasoning if enableThinking is true
        if (enableThinking) {
            // Configure reasoning based on model provider
            if (selectedModelId.includes("openai")) {
                // OpenAI models (o1, o3, gpt-5, etc.) support reasoningSummary
                providerOptions.openai = {
                    reasoningSummary: "detailed", // 'auto' for condensed or 'detailed' for comprehensive
                };
            } else if (selectedModelId.includes("google")) {
                // Google Gemini 2.0+ models support thinkingConfig
                // Reduced from 8192 to 3000 to avoid timeout issues
                providerOptions.google = {
                    thinkingConfig: {
                        includeThoughts: true,
                        thinkingBudget: 3000, // Optional token budget for thinking
                    },
                };
            } else if (selectedModelId.includes("anthropic")) {
                // Anthropic Claude models support thinking with budget
                // Reduced from 15000 to 5000 to avoid timeout issues
                providerOptions.anthropic = {
                    thinking: {
                        type: "enabled",
                        budgetTokens: 5000,
                    },
                };
            }
        }

        // Add interleaved thinking header for Claude 4 (only if thinking is enabled)
        const customHeaders: Record<string, string> = {};
        if (
            enableThinking &&
            (selectedModelId.includes("claude-sonnet-4") ||
                selectedModelId.includes("claude-4"))
        ) {
            customHeaders["anthropic-beta"] = "interleaved-thinking-2025-05-14";
        }

        // Stream response using AI SDK with optional webSearch tool
        logWithTimestamp("[chat] 🎬 Initializing streamText", {
            enableWebSearch,
            enableThinking,
            hasProviderOptions: Object.keys(providerOptions).length > 0,
            hasCustomHeaders: Object.keys(customHeaders).length > 0,
            providerOptions,
        });

        const streamStartTime = Date.now();
        let streamInitialized = false;
        let firstChunkTime: number | null = null;

        const result = streamText({
            model: gateway(selectedModelId),
            messages: modelMessages,
            stopWhen: stepCountIs(5),
            // Provider-specific options for reasoning
            providerOptions:
                Object.keys(providerOptions).length > 0
                    ? providerOptions
                    : undefined,
            // Headers for special features
            headers:
                Object.keys(customHeaders).length > 0
                    ? customHeaders
                    : undefined,
            // Only include webSearch tool if enabled
            tools: enableWebSearch
                ? {
                      webSearch: {
                          description:
                              "Search the web for current information, news, or real-time data. Always use this tool first when web search is enabled to provide the most up-to-date and accurate information.",
                          inputSchema: webSearchToolSchema,
                          execute: async ({ query }: { query: string }) => {
                              const toolStartTime = Date.now();
                              logWithTimestamp(
                                  "[chat] 🔍 Executing webSearch tool",
                                  {
                                      query,
                                      timeFromStreamStart:
                                          Date.now() - streamStartTime,
                                  },
                              );

                              try {
                                  const searchResults = await searchWeb(
                                      query,
                                      (env as any).TAVILY_API_KEY || "",
                                  );
                                  logWithTimestamp(
                                      "[chat] ✅ WebSearch completed",
                                      {
                                          sourcesCount:
                                              searchResults.sources.length,
                                          hasSummary: !!searchResults.summary,
                                          timeMs: Date.now() - toolStartTime,
                                      },
                                  );
                                  return searchResults;
                              } catch (error) {
                                  logWithTimestamp(
                                      "[chat] ❌ WebSearch failed",
                                      {
                                          error:
                                              error instanceof Error
                                                  ? error.message
                                                  : String(error),
                                          timeMs: Date.now() - toolStartTime,
                                      },
                                  );
                                  throw error;
                              }
                          },
                      },
                  }
                : {},
            // Force tool usage when web search is enabled
            toolChoice: enableWebSearch ? "required" : "auto",
            // Add callbacks to monitor streaming
            onChunk: (_chunk) => {
                if (!streamInitialized) {
                    streamInitialized = true;
                    firstChunkTime = Date.now();
                    logWithTimestamp("[chat] 📨 First chunk received", {
                        timeToFirstChunk: firstChunkTime - streamStartTime,
                    });
                }
            },
            onFinish: (result) => {
                logWithTimestamp("[chat] ✅ Stream finished", {
                    totalTime: Date.now() - streamStartTime,
                    usage: result.usage,
                    finishReason: result.finishReason,
                });
            },
        });

        logWithTimestamp("[chat] 🚀 Returning stream response", {
            streamSetupTime: Date.now() - streamStartTime,
        });

        // Return UI message stream response with sources and reasoning
        return result.toUIMessageStreamResponse({
            sendSources: true,
            sendReasoning: true,
        });
    } catch (error) {
        logWithTimestamp("[chat] ❌ Fatal error occurred", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
            cause: error instanceof Error ? error.cause : undefined,
        });

        // Log additional context for debugging
        console.error("[chat] Full error object:", error);

        return new Response(
            JSON.stringify({
                error:
                    error instanceof Error
                        ? error.message
                        : "Chat request failed",
                details:
                    error instanceof Error
                        ? {
                              name: error.name,
                              stack:
                                  process.env.NODE_ENV === "development"
                                      ? error.stack
                                      : undefined,
                          }
                        : undefined,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
