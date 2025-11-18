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

type MessagePart = UIMessage["parts"][number];

type ToolPart = MessagePart & {
    type: string;
    state?: string;
    input?: Record<string, unknown> | null;
    output?: Record<string, unknown> | null;
    toolName?: string;
};

const TOOL_PART_PREFIX = "tool-";

const isToolPart = (part: MessagePart): part is ToolPart => {
    const type = (part as { type?: unknown }).type;
    if (typeof type !== "string") {
        return false;
    }
    return type === "dynamic-tool" || type.startsWith(TOOL_PART_PREFIX);
};

const getToolName = (part: ToolPart) => {
    if (part.type === "dynamic-tool") {
        return typeof part.toolName === "string" ? part.toolName : undefined;
    }
    if (part.type.startsWith(TOOL_PART_PREFIX)) {
        return part.type.slice(TOOL_PART_PREFIX.length);
    }
    return undefined;
};

const extractSearchQuery = (input: unknown) => {
    if (input && typeof input === "object" && "query" in input) {
        const { query } = input as { query?: unknown };
        return typeof query === "string" ? query : String(query ?? "");
    }
    return "";
};

const collectSourcesFromOutput = (output: unknown) => {
    if (
        output &&
        typeof output === "object" &&
        "sources" in output &&
        Array.isArray((output as { sources?: unknown }).sources)
    ) {
        const { sources } = output as {
            sources: Array<{ title?: unknown; url?: unknown }>;
        };
        return sources
            .filter((source) => source.url && source.title)
            .map((source) => ({
                title: String(source.title),
                url: String(source.url),
            }));
    }
    return [];
};

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

                // Extract tool parts (AI SDK v5 dynamic tools) + legacy tool-call/result
                const toolInvocationParts = message.parts.filter(isToolPart);
                const webSearchToolParts = toolInvocationParts.filter(
                    (part) => getToolName(part) === "webSearch",
                );
                const legacyToolCallParts = message.parts.filter(
                    (part) => part.type === "tool-call",
                );
                const legacyToolResultParts = message.parts.filter(
                    (part) => part.type === "tool-result",
                );

                // Detect ongoing search (tool-call without corresponding tool-result)
                let isSearching = false;
                let searchQuery = "";
                let isQueryBuilding = false;

                if (status === "streaming") {
                    if (webSearchToolParts.length > 0) {
                        const pendingToolPart = webSearchToolParts.find(
                            (part) =>
                                part.state === "input-streaming" ||
                                part.state === "input-available",
                        );

                        if (pendingToolPart) {
                            isSearching = true;
                            searchQuery = extractSearchQuery(
                                pendingToolPart.input,
                            );
                            isQueryBuilding =
                                pendingToolPart.state === "input-streaming";
                        }
                    } else {
                        for (const toolCall of legacyToolCallParts) {
                            if (toolCall.type !== "tool-call") continue;

                            const hasToolName = "toolName" in toolCall;
                            if (
                                !hasToolName ||
                                (toolCall as any).toolName !== "webSearch"
                            ) {
                                continue;
                            }

                            const hasResult = legacyToolResultParts.some(
                                (result) =>
                                    result.type === "tool-result" &&
                                    result.toolCallId === toolCall.toolCallId,
                            );

                            if (!hasResult) {
                                isSearching = true;
                                searchQuery = extractSearchQuery(
                                    toolCall.input,
                                );
                                if ("state" in toolCall) {
                                    const state = (toolCall as any).state;
                                    isQueryBuilding =
                                        state === "input-streaming";
                                }
                                break;
                            }
                        }
                    }
                }

                // Extract sources from tool results (custom search tools like Tavily)
                const webSearchSources: { title: string; url: string }[] = [];

                webSearchToolParts.forEach((toolPart) => {
                    if (toolPart.state === "output-available") {
                        webSearchSources.push(
                            ...collectSourcesFromOutput(toolPart.output),
                        );
                    }
                });

                legacyToolResultParts.forEach((toolResult) => {
                    if (toolResult.type === "tool-result") {
                        webSearchSources.push(
                            ...collectSourcesFromOutput(
                                (toolResult as { output?: unknown }).output,
                            ),
                        );
                    }
                });

                const totalSources =
                    sourceUrlParts.length + webSearchSources.length;

                return (
                    <div key={message.id}>
                        {/* Display searching status */}
                        {message.role === "assistant" && isSearching && (
                            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 md:p-4">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="relative shrink-0">
                                        <Search className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                        <Loader2 className="absolute -right-1 -top-1 h-3 w-3 animate-spin text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {isQueryBuilding ? (
                                            <div>
                                                <div className="text-sm font-medium text-foreground">
                                                    Preparing search query...
                                                </div>
                                                {searchQuery && (
                                                    <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
                                                        {searchQuery}
                                                        <span className="inline-block w-1 h-3 ml-0.5 bg-primary animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-sm font-medium text-foreground">
                                                    Searching the web...
                                                </div>
                                                {searchQuery && (
                                                    <div className="text-xs text-muted-foreground mt-1 truncate">
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

                                    const reasoningPart = part as any;
                                    const reasoningText =
                                        typeof reasoningPart.text === "string"
                                            ? reasoningPart.text
                                            : typeof reasoningPart.reasoning ===
                                                "string"
                                              ? reasoningPart.reasoning
                                              : JSON.stringify(reasoningPart);

                                    return (
                                        <Reasoning
                                            key={`${message.id}-${i}`}
                                            className="w-full mb-4"
                                            isStreaming={isStreaming}
                                        >
                                            <ReasoningTrigger />
                                            <ReasoningContent>
                                                {reasoningText}
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
