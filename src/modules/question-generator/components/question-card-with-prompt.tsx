"use client";

import { PlayableQuestionCard } from "./playable-question-card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";
import type { Question } from "@/types/questions";

interface QuestionCardWithPromptProps {
    question: Question;
    questionNumber: number;
    onComplete: (isCorrect: boolean) => void;
    prompt?: string;
    knowledgePoint?: string;
}

export function QuestionCardWithPrompt({
    question,
    questionNumber,
    onComplete,
    prompt,
    knowledgePoint,
}: QuestionCardWithPromptProps) {
    return (
        <div className="relative">
            {/* Prompt Popover Button - Top Right */}
            {prompt && (
                <div className="absolute -top-2 -right-2 z-20">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-full shadow-sm border-2 bg-background hover:bg-muted"
                            >
                                <Code className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[500px] max-h-[600px] overflow-y-auto"
                            align="end"
                        >
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">
                                        题目 {questionNumber} - 生成提示词
                                    </h4>
                                    {knowledgePoint && (
                                        <p className="text-xs text-muted-foreground">
                                            知识点: {knowledgePoint}
                                        </p>
                                    )}
                                </div>
                                <div className="border-t pt-3">
                                    <pre className="text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                        {prompt}
                                    </pre>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {/* Question Card */}
            <PlayableQuestionCard
                question={question}
                questionNumber={questionNumber}
                onComplete={onComplete}
            />
        </div>
    );
}
