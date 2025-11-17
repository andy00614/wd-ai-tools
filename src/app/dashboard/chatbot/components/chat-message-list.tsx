import type { UIMessage } from "ai";
import {
    Message,
    MessageContent,
    MessageResponse,
} from "@/components/ai-elements/message";
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
    Source,
    Sources,
    SourcesContent,
    SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Search, Loader2 } from "lucide-react";

interface ChatMessageListProps {
    messages: UIMessage[];
    status?: "submitted" | "streaming" | "ready" | "error";
}

export function ChatMessageList({ messages, status }: ChatMessageListProps) {
    return (
        <>
            {messages.map((message) => {
                // Extract source-url parts (native search support from some providers like Perplexity)
                const sourceUrlParts = message.parts.filter(
                    (part) => part.type === "source-url",
                );

                // Extract tool call parts
                const toolCallParts = message.parts.filter(
                    (part) => part.type === "tool-call",
                );
                const toolResultParts = message.parts.filter(
                    (part) => part.type === "tool-result",
                );

                // Detect ongoing search (tool-call without corresponding tool-result)
                let isSearching = false;
                let searchQuery = "";
                let isQueryBuilding = false;

                if (status === "streaming") {
                    for (const toolCall of toolCallParts) {
                        if (toolCall.type !== "tool-call") continue;

                        // Check toolName property (needs type guard)
                        const hasToolName = "toolName" in toolCall;
                        if (
                            !hasToolName ||
                            (toolCall as any).toolName !== "webSearch"
                        )
                            continue;

                        // Check if there's a corresponding result
                        const hasResult = toolResultParts.some(
                            (result) =>
                                result.type === "tool-result" &&
                                result.toolCallId === toolCall.toolCallId,
                        );

                        if (!hasResult) {
                            isSearching = true;
                            // Extract search query
                            if ("input" in toolCall) {
                                const input = toolCall.input;
                                if (
                                    input &&
                                    typeof input === "object" &&
                                    "query" in input
                                ) {
                                    searchQuery = String(input.query);
                                }
                            }

                            // Check if query is still being built (via state property)
                            if ("state" in toolCall) {
                                const state = (toolCall as any).state;
                                isQueryBuilding = state === "input-streaming";
                            }
                            break;
                        }
                    }
                }

                // Extract sources from tool results (custom search tools like Tavily)
                const webSearchSources: { title: string; url: string }[] = [];

                toolResultParts.forEach((toolResult) => {
                    if (
                        toolResult.type === "tool-result" &&
                        "output" in toolResult &&
                        toolResult.output &&
                        typeof toolResult.output === "object" &&
                        "sources" in toolResult.output
                    ) {
                        const sources = toolResult.output.sources;
                        if (Array.isArray(sources)) {
                            sources.forEach((source: any) => {
                                if (source.url && source.title) {
                                    webSearchSources.push({
                                        title: source.title,
                                        url: source.url,
                                    });
                                }
                            });
                        }
                    }
                });

                const totalSources =
                    sourceUrlParts.length + webSearchSources.length;

                return (
                    <div key={message.id}>
                        {/* Display searching status */}
                        {message.role === "assistant" && isSearching && (
                            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <Loader2 className="absolute -right-1 -top-1 h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        {isQueryBuilding ? (
                                            <div>
                                                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                    Preparing search query...
                                                </div>
                                                {searchQuery && (
                                                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-mono">
                                                        {searchQuery}
                                                        <span className="inline-block w-1 h-3 ml-0.5 bg-blue-600 dark:bg-blue-400 animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                    Searching the web...
                                                </div>
                                                {searchQuery && (
                                                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                        Search: {searchQuery}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Display search sources (if any) */}
                        {message.role === "assistant" && totalSources > 0 && (
                            <Sources>
                                <SourcesTrigger count={totalSources} />

                                {/* Provider native sources (e.g., Perplexity) */}
                                {sourceUrlParts.map((part, i) => {
                                    if (part.type !== "source-url") return null;
                                    return (
                                        <SourcesContent
                                            key={`${message.id}-source-${i}`}
                                        >
                                            <Source
                                                href={part.url}
                                                title={part.url}
                                            />
                                        </SourcesContent>
                                    );
                                })}

                                {/* Tool call sources (e.g., Tavily) */}
                                {webSearchSources.map((source, i) => (
                                    <SourcesContent
                                        key={`${message.id}-tool-source-${i}`}
                                    >
                                        <Source
                                            href={source.url}
                                            title={source.title}
                                        />
                                    </SourcesContent>
                                ))}
                            </Sources>
                        )}

                        {/* Display message parts */}
                        {message.parts.map((part, i) => {
                            switch (part.type) {
                                case "text":
                                    return (
                                        <Message
                                            key={`${message.id}-${i}`}
                                            from={
                                                message.role === "user"
                                                    ? "user"
                                                    : "assistant"
                                            }
                                        >
                                            <MessageContent>
                                                <MessageResponse>
                                                    {part.text}
                                                </MessageResponse>
                                            </MessageContent>
                                        </Message>
                                    );

                                case "reasoning": {
                                    // Check if current reasoning is streaming
                                    const isStreaming =
                                        status === "streaming" &&
                                        i === message.parts.length - 1 &&
                                        message.id === messages.at(-1)?.id;

                                    return (
                                        <Reasoning
                                            key={`${message.id}-${i}`}
                                            className="w-full mb-4"
                                            isStreaming={isStreaming}
                                        >
                                            <ReasoningTrigger />
                                            <ReasoningContent>
                                                {part.text}
                                            </ReasoningContent>
                                        </Reasoning>
                                    );
                                }

                                default:
                                    // Ignore tool-call, tool-result, source-url types as they're handled above
                                    return null;
                            }
                        })}
                    </div>
                );
            })}
        </>
    );
}
