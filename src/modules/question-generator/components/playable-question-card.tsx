"use client";

import { ClueQuestionCard } from "@/components/questions-game/ClueQuestionCard";
import { FillBlankQuestionCard } from "@/components/questions-game/FillBlankQuestionCard";
import { GuessImageQuestionCard } from "@/components/questions-game/GuessImageQuestionCard";
import { EventOrderQuestionCard } from "@/components/questions-game/EventOrderQuestionCard";
import type { Question } from "@/types/questions";

interface PlayableQuestionCardProps {
    question: Question;
    questionNumber: number;
    onComplete?: (isCorrect: boolean) => void;
}

export function PlayableQuestionCard({
    question,
    questionNumber,
    onComplete,
}: PlayableQuestionCardProps) {
    const handleComplete = (isCorrect: boolean) => {
        console.log(
            `Question ${questionNumber} completed: ${isCorrect ? "Correct" : "Incorrect"}`,
        );
        onComplete?.(isCorrect);
    };

    switch (question.type) {
        case "clue":
            return (
                <ClueQuestionCard
                    question={question}
                    onComplete={handleComplete}
                />
            );

        case "fill-blank":
            return (
                <FillBlankQuestionCard
                    question={question}
                    onComplete={handleComplete}
                />
            );

        case "guess-image":
            return (
                <GuessImageQuestionCard
                    question={question}
                    onComplete={handleComplete}
                />
            );

        case "event-order":
            return (
                <EventOrderQuestionCard
                    question={question}
                    onComplete={handleComplete}
                />
            );

        default:
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <p>Unknown question type</p>
                </div>
            );
    }
}
