"use client";

import { useCallback, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ChatMessageList } from "./components/chat-message-list";
import { ChatInputArea } from "./components/chat-input-area";
import { ChatSuggestions } from "./components/chat-suggestions";
import { Loader } from "@/components/ai-elements/loader";

// Suggestion list
const defaultSuggestions = [
    "What are the latest trends in AI?",
    "How does machine learning work?",
    "Explain quantum computing",
    "Best practices for React development",
    "Tell me about TypeScript benefits",
    "How to optimize database queries?",
    "What is the difference between SQL and NoSQL?",
    "Explain cloud computing basics",
];

// Model list interface
interface Model {
    id: string;
    name: string;
}

interface ChatbotClientProps {
    models: Model[];
    suggestions?: string[];
}

const ChatbotClient = ({
    models,
    suggestions = defaultSuggestions,
}: ChatbotClientProps) => {
    const [selectedModel, setSelectedModel] = useState<string>(
        models[0]?.id ?? "",
    );
    const [text, setText] = useState<string>("");
    const [useMicrophone, setUseMicrophone] = useState<boolean>(false);
    const [enableWebSearch, setEnableWebSearch] = useState<boolean>(false);

    // Create transport
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
            }),
        [],
    );

    // Use useChat hook for managing chat state
    const { messages, sendMessage, status, error } = useChat({
        transport,
        onError: (error) => {
            console.error("[chatbot] Chat error:", error);
        },
        onFinish: (message) => {
            console.log("[chatbot] Message finished:", message);
        },
    });

    // Debug logs
    console.log("[chatbot] Status:", status);
    console.log("[chatbot] Messages:", messages.length);
    console.log("[chatbot] Error:", error);

    // Handle form submission
    const handleSubmit = useCallback(
        (message: PromptInputMessage) => {
            const hasText = Boolean(message.text);
            const hasAttachments = Boolean(message.files?.length);

            if (!(hasText || hasAttachments)) {
                return;
            }

            // Send message
            console.log("[chatbot] Sending message:", {
                text: message.text,
                model: selectedModel,
            });
            sendMessage(
                {
                    text: message.text || "Sent with attachments",
                    files: message.files,
                },
                {
                    body: {
                        model: selectedModel,
                        enableWebSearch,
                    },
                },
            );
            setText("");
        },
        [sendMessage, selectedModel, enableWebSearch],
    );

    // Handle suggestion click
    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            sendMessage(
                {
                    text: suggestion,
                },
                {
                    body: {
                        model: selectedModel,
                        enableWebSearch,
                    },
                },
            );
        },
        [sendMessage, selectedModel, enableWebSearch],
    );

    // Map status to component status type
    const mappedStatus: "submitted" | "streaming" | "ready" | "error" =
        status === "streaming"
            ? "streaming"
            : status === "ready"
              ? "ready"
              : status === "error"
                ? "error"
                : "submitted";

    return (
        <div className="flex h-screen max-w-4xl mx-auto flex-col p-6">
            <Conversation className="flex-1">
                <ConversationContent>
                    <ChatMessageList
                        messages={messages}
                        status={mappedStatus}
                    />
                    {status === "submitted" && <Loader />}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>

            <div className="shrink-0 space-y-4 mt-4">
                <ChatSuggestions
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                />
                <ChatInputArea
                    text={text}
                    onTextChange={setText}
                    onSubmit={handleSubmit}
                    model={selectedModel}
                    onModelChange={setSelectedModel}
                    models={models}
                    useMicrophone={useMicrophone}
                    onMicrophoneToggle={() => setUseMicrophone(!useMicrophone)}
                    enableWebSearch={enableWebSearch}
                    onWebSearchToggle={() =>
                        setEnableWebSearch(!enableWebSearch)
                    }
                    status={mappedStatus}
                />
            </div>

            {error && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
                    Error: {error.message}
                </div>
            )}
        </div>
    );
};

export default ChatbotClient;
