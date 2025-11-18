import {
    PromptInput,
    PromptInputActionAddAttachments,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    PromptInputButton,
    PromptInputFooter,
    PromptInputHeader,
    type PromptInputMessage,
    PromptInputSelect,
    PromptInputSelectContent,
    PromptInputSelectItem,
    PromptInputSelectTrigger,
    PromptInputSelectValue,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { MicIcon, Sparkles, Brain } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
    text: string;
    onTextChange: (text: string) => void;
    onSubmit: (message: PromptInputMessage) => void;
    model: string;
    onModelChange: (modelId: string) => void;
    models: { id: string; name: string }[];
    useMicrophone: boolean;
    onMicrophoneToggle: () => void;
    enableWebSearch: boolean;
    onWebSearchToggle: () => void;
    enableThinking: boolean;
    onThinkingToggle: () => void;
    status: "submitted" | "streaming" | "ready" | "error";
}

export function ChatInputArea({
    text,
    onTextChange,
    onSubmit,
    model,
    onModelChange,
    models,
    useMicrophone,
    onMicrophoneToggle,
    enableWebSearch,
    onWebSearchToggle,
    enableThinking,
    onThinkingToggle,
    status,
}: ChatInputAreaProps) {
    return (
        <PromptInput globalDrop multiple onSubmit={onSubmit}>
            <PromptInputHeader>
                <PromptInputAttachments>
                    {(attachment) => (
                        <PromptInputAttachment data={attachment} />
                    )}
                </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
                <PromptInputTextarea
                    onChange={(event) => onTextChange(event.target.value)}
                    value={text}
                />
            </PromptInputBody>
            <PromptInputFooter>
                <PromptInputTools>
                    <PromptInputActionMenu>
                        <PromptInputActionMenuTrigger />
                        <PromptInputActionMenuContent>
                            <PromptInputActionAddAttachments />
                        </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <PromptInputButton
                        onClick={onMicrophoneToggle}
                        variant={useMicrophone ? "default" : "ghost"}
                    >
                        <MicIcon size={16} />
                        <span className="sr-only">Microphone</span>
                    </PromptInputButton>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PromptInputButton
                                    onClick={onWebSearchToggle}
                                    variant={
                                        enableWebSearch ? "default" : "ghost"
                                    }
                                    className="cursor-pointer"
                                >
                                    <Sparkles
                                        size={16}
                                        className={cn(
                                            enableWebSearch
                                                ? "text-primary-foreground"
                                                : "text-primary",
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-xs hidden sm:inline",
                                            enableWebSearch
                                                ? "text-primary-foreground font-semibold"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {enableWebSearch
                                            ? "🔍 Force Search"
                                            : "Web Search"}
                                    </span>
                                </PromptInputButton>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs text-xs">
                                    {enableWebSearch
                                        ? "🔍 Force web search is ON. Every query will search the web for the latest information before responding."
                                        : "Click to enable forced web search. When enabled, AI will always search the web before answering."}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PromptInputButton
                                    onClick={onThinkingToggle}
                                    variant={
                                        enableThinking ? "default" : "ghost"
                                    }
                                    className="cursor-pointer"
                                >
                                    <Brain
                                        size={16}
                                        className={cn(
                                            enableThinking
                                                ? "text-primary-foreground"
                                                : "text-accent",
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-xs hidden sm:inline",
                                            enableThinking
                                                ? "text-primary-foreground font-semibold"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {enableThinking
                                            ? "🧠 Thinking"
                                            : "Thinking"}
                                    </span>
                                </PromptInputButton>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs text-xs">
                                    {enableThinking
                                        ? "🧠 Deep thinking mode is ON. AI will use extended reasoning for better quality responses (may be slower)."
                                        : "Click to enable deep thinking mode. When enabled, AI models will engage extended reasoning capabilities for more thorough responses."}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PromptInputSelect
                        onValueChange={onModelChange}
                        value={model}
                    >
                        <PromptInputSelectTrigger>
                            <PromptInputSelectValue />
                        </PromptInputSelectTrigger>
                        <PromptInputSelectContent>
                            {models.map((model) => (
                                <PromptInputSelectItem
                                    key={model.id}
                                    value={model.id}
                                >
                                    {model.name}
                                </PromptInputSelectItem>
                            ))}
                        </PromptInputSelectContent>
                    </PromptInputSelect>
                </PromptInputTools>
                <PromptInputSubmit
                    disabled={
                        !(text.trim() || status) || status === "streaming"
                    }
                    status={status}
                />
            </PromptInputFooter>
        </PromptInput>
    );
}
