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
    try {
        console.log("[webSearch] Searching with Tavily:", query);

        // Initialize Tavily client
        const tavilyClient = tavily({ apiKey });

        // Perform search
        const response = await tavilyClient.search(query, {
            maxResults: 5,
            searchDepth: "basic", // or "advanced" for more thorough search
            includeAnswer: true, // Get AI-generated answer
        });

        console.log("[webSearch] Results:", response.results.length);

        // Format sources
        const sources = response.results.map((result) => ({
            title: result.title,
            url: result.url,
            snippet: result.content,
        }));

        // Use Tavily's answer if available, otherwise create summary
        const summary =
            response.answer ||
            `Found ${sources.length} results for "${query}". ${sources[0]?.snippet || ""}`;

        return { sources, summary };
    } catch (error) {
        console.error("[webSearch] Error:", error);

        // Return error message but don't crash
        return {
            sources: [],
            summary: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}. Please check your TAVILY_API_KEY is configured.`,
        };
    }
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
    try {
        console.log("[chat] Received request");
        const body = (await request.json()) as {
            messages: UIMessage[];
            model?: string;
            enableWebSearch?: boolean;
        };
        const { messages, model, enableWebSearch = false } = body;

        console.log("[chat] Body:", {
            messagesCount: messages?.length,
            model,
            enableWebSearch,
        });

        // Validate input
        if (!messages || !Array.isArray(messages)) {
            console.error("[chat] Invalid messages:", messages);
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

        // Default model if not provided
        const selectedModelId = model || "openai/gpt-4o";
        console.log("[chat] Using model:", selectedModelId);

        // Get Cloudflare context and AI Gateway
        const { env } = await getCloudflareContext();
        console.log("[chat] Got Cloudflare context");

        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });
        console.log("[chat] Created gateway");

        // Convert UIMessages to ModelMessages
        console.log("[chat] Converting messages...");
        const modelMessages = convertToModelMessages(messages);
        console.log("[chat] Converted messages count:", modelMessages.length);

        // Determine provider-specific options for reasoning/thinking
        const providerOptions: Record<string, any> = {};

        // Configure reasoning based on model provider
        if (selectedModelId.includes("openai")) {
            // OpenAI models (o1, o3, gpt-5, etc.) support reasoningSummary
            providerOptions.openai = {
                reasoningSummary: "detailed", // 'auto' for condensed or 'detailed' for comprehensive
            };
        } else if (selectedModelId.includes("google")) {
            // Google Gemini 2.0+ models support thinkingConfig
            providerOptions.google = {
                thinkingConfig: {
                    includeThoughts: true,
                    thinkingBudget: 8192, // Optional token budget for thinking
                },
            };
        } else if (selectedModelId.includes("anthropic")) {
            // Anthropic Claude models support thinking with budget
            providerOptions.anthropic = {
                thinking: {
                    type: "enabled",
                    budgetTokens: 15000,
                },
            };
        }

        // Add interleaved thinking header for Claude 4
        const headers: Record<string, string> = {};
        if (
            selectedModelId.includes("claude-sonnet-4") ||
            selectedModelId.includes("claude-4")
        ) {
            headers["anthropic-beta"] = "interleaved-thinking-2025-05-14";
        }

        // Stream response using AI SDK with optional webSearch tool
        console.log(
            "[chat] Starting streamText with enableWebSearch:",
            enableWebSearch,
        );
        console.log("[chat] Provider options:", providerOptions);
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
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            // Only include webSearch tool if enabled
            tools: enableWebSearch
                ? {
                      webSearch: {
                          description:
                              "Search the web for current information, news, or real-time data. Always use this tool first when web search is enabled to provide the most up-to-date and accurate information.",
                          inputSchema: webSearchToolSchema,
                          execute: async ({ query }: { query: string }) => {
                              console.log(
                                  "[chat] Executing webSearch for query:",
                                  query,
                              );
                              const searchResults = await searchWeb(
                                  query,
                                  (env as any).TAVILY_API_KEY || "",
                              );
                              console.log(
                                  "[chat] WebSearch results:",
                                  searchResults,
                              );
                              return searchResults;
                          },
                      },
                  }
                : {},
            // Force tool usage when web search is enabled
            toolChoice: enableWebSearch ? "required" : "auto",
        });

        console.log("[chat] Returning stream response...");
        // Return UI message stream response with sources and reasoning
        return result.toUIMessageStreamResponse({
            sendSources: true,
            sendReasoning: true,
        });
    } catch (error) {
        console.error("[chat] Error:", error);
        console.error(
            "[chat] Error stack:",
            error instanceof Error ? error.stack : "No stack",
        );
        return new Response(
            JSON.stringify({
                error:
                    error instanceof Error
                        ? error.message
                        : "Chat request failed",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
