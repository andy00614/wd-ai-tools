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
import { MicIcon, Sparkles } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
                                        className={
                                            enableWebSearch
                                                ? "text-white"
                                                : "text-blue-500"
                                        }
                                    />
                                    <span
                                        className={`text-xs ${enableWebSearch ? "text-white font-semibold" : "text-muted-foreground"}`}
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
