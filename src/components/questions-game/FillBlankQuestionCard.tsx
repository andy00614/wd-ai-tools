"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Lightbulb, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { FillBlankQuestion } from "@/types/questions";

interface FillBlankQuestionCardProps {
    question: FillBlankQuestion;
    onComplete?: (isCorrect: boolean) => void;
}

export function FillBlankQuestionCard({
    question,
    onComplete,
}: FillBlankQuestionCardProps) {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [correctBlanks, setCorrectBlanks] = useState<Set<number>>(new Set());
    const [showHints, setShowHints] = useState(false);

    const difficultyColors = {
        1: "bg-green-100 text-green-800 border-green-300",
        2: "bg-yellow-100 text-yellow-800 border-yellow-300",
        3: "bg-red-100 text-red-800 border-red-300",
    };

    const difficultyLabels = {
        1: "简单",
        2: "中等",
        3: "困难",
    };

    // 渲染句子，将占位符替换为输入框或选择器
    const renderSentenceWithBlanks = () => {
        const parts = question.sentence.split("____");
        const result: React.ReactElement[] = [];

        parts.forEach((part, index) => {
            // 添加文本部分
            const textKey = `text-${question.id}-${index}`;
            result.push(
                <span key={textKey} className="text-base">
                    {part}
                </span>,
            );

            // 如果不是最后一个部分，添加空白输入框
            if (index < parts.length - 1) {
                const blankIndex = index;
                const blank = question.blanks[blankIndex];

                if (!blank) {
                    return;
                }

                const isCorrect = correctBlanks.has(blankIndex);
                const isIncorrect =
                    isSubmitted && !correctBlanks.has(blankIndex);

                // 如果有选项，渲染下拉选择
                if (blank.options && blank.options.length > 0) {
                    const selectKey = `blank-${question.id}-${blankIndex}`;
                    result.push(
                        <select
                            key={selectKey}
                            value={userAnswers[blankIndex] || ""}
                            onChange={(e) =>
                                handleAnswerChange(blankIndex, e.target.value)
                            }
                            disabled={isSubmitted}
                            className={cn(
                                "inline-flex mx-1 px-3 py-1 border rounded-md text-sm font-medium",
                                "focus:outline-none focus:ring-2 focus:ring-primary",
                                isSubmitted && isCorrect
                                    ? "border-green-500 bg-green-50 text-green-900"
                                    : "",
                                isSubmitted && isIncorrect
                                    ? "border-red-500 bg-red-50 text-red-900"
                                    : "",
                                !isSubmitted
                                    ? "border-border bg-background"
                                    : "",
                            )}
                        >
                            <option value="">请选择</option>
                            {blank.options.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>,
                    );
                } else {
                    // 渲染输入框
                    const inputKey = `blank-${question.id}-${blankIndex}`;
                    result.push(
                        <Input
                            key={inputKey}
                            type="text"
                            value={userAnswers[blankIndex] || ""}
                            onChange={(e) =>
                                handleAnswerChange(blankIndex, e.target.value)
                            }
                            disabled={isSubmitted}
                            className={cn(
                                "inline-flex mx-1 w-32 h-9 text-center font-medium",
                                isSubmitted && isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : "",
                                isSubmitted && isIncorrect
                                    ? "border-red-500 bg-red-50"
                                    : "",
                            )}
                            placeholder="____"
                        />,
                    );
                }
            }
        });

        return (
            <div className="flex flex-wrap items-center gap-y-2">{result}</div>
        );
    };

    const handleAnswerChange = (blankIndex: number, value: string) => {
        setUserAnswers((prev) => ({
            ...prev,
            [blankIndex]: value,
        }));
    };

    const handleSubmit = () => {
        const correct = new Set<number>();
        let allCorrect = true;

        // 检查每个空白的答案
        question.blanks.forEach((blank, index) => {
            const userAnswer = userAnswers[index]?.trim().toLowerCase() || "";
            const correctAnswer = blank.correctAnswer.toLowerCase();

            if (userAnswer === correctAnswer) {
                correct.add(index);
            } else {
                allCorrect = false;
            }
        });

        setCorrectBlanks(correct);
        setIsSubmitted(true);

        if (allCorrect) {
            toast.success("全部答对了！");
            if (onComplete) {
                onComplete(true);
            }
        } else {
            toast.error(
                `答对了 ${correct.size}/${question.blanks.length} 个空`,
            );
            if (onComplete) {
                onComplete(false);
            }
        }
    };

    const handleReset = () => {
        setUserAnswers({});
        setIsSubmitted(false);
        setCorrectBlanks(new Set());
        setShowHints(false);
    };

    const allBlanksFilled = question.blanks.every((_, index) =>
        userAnswers[index]?.trim(),
    );

    const score = isSubmitted
        ? Math.round((correctBlanks.size / question.blanks.length) * 100)
        : 0;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">填空题</CardTitle>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "font-medium",
                            difficultyColors[question.difficulty],
                        )}
                    >
                        {difficultyLabels[question.difficulty]}
                    </Badge>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Question Sentence with Blanks */}
                <div className="p-6 rounded-lg border-2 border-primary/20 bg-muted/30">
                    <div className="text-lg leading-relaxed">
                        {renderSentenceWithBlanks()}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                        共 {question.blanks.length} 个空白需要填写
                    </div>
                </div>

                {/* Hints Section */}
                {question.hints &&
                    question.hints.length > 0 &&
                    !isSubmitted && (
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHints(!showHints)}
                                className="h-8 text-xs"
                            >
                                <Lightbulb className="w-3 h-3 mr-1" />
                                {showHints ? "隐藏提示" : "查看提示"}
                            </Button>

                            {showHints && (
                                <div className="space-y-2 animate-in slide-in-from-top">
                                    {question.hints.map((hint, index) => (
                                        <div
                                            key={`hint-${hint.slice(0, 20)}-${index}`}
                                            className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs"
                                        >
                                            💡 {hint}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                {/* Submit/Reset Buttons */}
                <div className="flex gap-2">
                    {!isSubmitted ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={!allBlanksFilled}
                            className="flex-1"
                        >
                            提交答案
                        </Button>
                    ) : (
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="flex-1"
                        >
                            重新尝试
                        </Button>
                    )}
                </div>

                {/* Result Display */}
                {isSubmitted && (
                    <div
                        className={cn(
                            "p-4 rounded-lg border-2 animate-in slide-in-from-bottom",
                            score === 100
                                ? "bg-green-50 border-green-500"
                                : "bg-amber-50 border-amber-500",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            {score === 100 ? (
                                <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p
                                        className={cn(
                                            "font-semibold",
                                            score === 100
                                                ? "text-green-900"
                                                : "text-amber-900",
                                        )}
                                    >
                                        {score === 100
                                            ? "🎉 全部答对！"
                                            : "部分正确"}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="bg-white"
                                    >
                                        得分: {score}%
                                    </Badge>
                                </div>

                                {/* Show correct answers for wrong blanks */}
                                {score < 100 && (
                                    <div className="space-y-1">
                                        {question.blanks.map((blank, index) => {
                                            if (!correctBlanks.has(index)) {
                                                const correctionKey = `correction-${question.id}-${index}`;
                                                return (
                                                    <div
                                                        key={correctionKey}
                                                        className="text-sm"
                                                    >
                                                        第 {index + 1} 个空：
                                                        <span className="font-semibold ml-1">
                                                            {
                                                                blank.correctAnswer
                                                            }
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                )}

                                {question.explanation && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            📚 {question.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
