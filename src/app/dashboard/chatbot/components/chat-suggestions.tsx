import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

interface ChatSuggestionsProps {
    suggestions: string[];
    onSuggestionClick: (suggestion: string) => void;
}

export function ChatSuggestions({
    suggestions,
    onSuggestionClick,
}: ChatSuggestionsProps) {
    return (
        <Suggestions className="px-0 md:px-4">
            {suggestions.map((suggestion) => (
                <Suggestion
                    key={suggestion}
                    onClick={() => onSuggestionClick(suggestion)}
                    suggestion={suggestion}
                />
            ))}
        </Suggestions>
    );
}
