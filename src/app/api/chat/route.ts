import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
    createGateway,
    streamText,
    convertToModelMessages,
    type UIMessage,
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
        };
        const { messages, model } = body;

        console.log("[chat] Body:", { messagesCount: messages?.length, model });

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

        // Stream response using AI SDK with webSearch tool
        console.log("[chat] Starting streamText...");
        const result = streamText({
            model: gateway(selectedModelId),
            messages: modelMessages,
            tools: {
                webSearch: {
                    description:
                        "Search the web for current information, news, or real-time data. Use this when the user asks about current events, recent news, or information that may not be in your training data.",
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
                        console.log("[chat] WebSearch results:", searchResults);
                        return searchResults;
                    },
                },
            },
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
