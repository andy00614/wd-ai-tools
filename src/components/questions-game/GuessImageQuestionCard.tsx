"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    Lightbulb,
    Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { GuessImageQuestion } from "@/types/questions";

interface GuessImageQuestionCardProps {
    question: GuessImageQuestion;
    onComplete?: (isCorrect: boolean) => void;
}

export function GuessImageQuestionCard({
    question,
    onComplete,
}: GuessImageQuestionCardProps) {
    const [userAnswer, setUserAnswer] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showHints, setShowHints] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);

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

    const guessTypeLabels = {
        movie: "电影",
        person: "人物",
        place: "地点",
        object: "物品",
        other: "其他",
    };

    const handleSubmit = () => {
        const trimmedAnswer = userAnswer.trim().toLowerCase();
        const correctAnswer = question.answer.toLowerCase();

        setAttemptCount(attemptCount + 1);

        // 简单的答案匹配
        const correct = trimmedAnswer === correctAnswer;

        setIsCorrect(correct);
        setIsSubmitted(true);

        if (correct) {
            toast.success("恭喜答对了！");
            if (onComplete) {
                onComplete(true);
            }
        } else {
            toast.error("答案不正确");
            if (onComplete) {
                onComplete(false);
            }
        }
    };

    const handleReset = () => {
        setUserAnswer("");
        setIsSubmitted(false);
        setIsCorrect(null);
        setShowHints(false);
        setAttemptCount(0);
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">
                            看图猜{guessTypeLabels[question.guessType]}
                        </CardTitle>
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
                {/* Image or Description Display */}
                <div className="space-y-3">
                    {question.imageUrl ? (
                        // Phase 2: Display actual image
                        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-border">
                            <img
                                src={question.imageUrl}
                                alt="Question visual"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : question.imageDescription ? (
                        // Phase 1: Display text description instead
                        <div className="p-6 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-muted/50 to-muted/30">
                            <div className="flex items-center gap-2 mb-3">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    视觉描述（暂无图片）
                                </p>
                            </div>
                            <p className="text-base leading-relaxed">
                                {question.imageDescription}
                            </p>
                        </div>
                    ) : (
                        <div className="p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 text-center">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">
                                暂无图片或描述
                            </p>
                        </div>
                    )}
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

                {/* Answer Input */}
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder={`猜猜这是什么${guessTypeLabels[question.guessType]}...`}
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={isSubmitted}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    !isSubmitted &&
                                    userAnswer.trim()
                                ) {
                                    handleSubmit();
                                }
                            }}
                            className={cn(
                                "flex-1",
                                isSubmitted &&
                                    (isCorrect
                                        ? "border-green-500 bg-green-50"
                                        : "border-red-500 bg-red-50"),
                            )}
                        />
                        {!isSubmitted ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={!userAnswer.trim()}
                                className="min-w-[100px]"
                            >
                                提交答案
                            </Button>
                        ) : (
                            <Button onClick={handleReset} variant="outline">
                                重新尝试
                            </Button>
                        )}
                    </div>

                    {/* Result Display */}
                    {isSubmitted && (
                        <div
                            className={cn(
                                "p-4 rounded-lg border-2 animate-in slide-in-from-bottom",
                                isCorrect
                                    ? "bg-green-50 border-green-500"
                                    : "bg-red-50 border-red-500",
                            )}
                        >
                            <div className="flex items-start gap-3">
                                {isCorrect ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p
                                            className={cn(
                                                "font-semibold",
                                                isCorrect
                                                    ? "text-green-900"
                                                    : "text-red-900",
                                            )}
                                        >
                                            {isCorrect
                                                ? "🎉 答对了！"
                                                : "❌ 很遗憾"}
                                        </p>
                                        {isCorrect && (
                                            <Badge
                                                variant="outline"
                                                className="bg-white"
                                            >
                                                尝试 {attemptCount} 次
                                            </Badge>
                                        )}
                                    </div>
                                    {!isCorrect && (
                                        <p className="text-sm text-red-800">
                                            正确答案是：
                                            <span className="font-semibold ml-1">
                                                {question.answer}
                                            </span>
                                        </p>
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
                </div>
            </CardContent>
        </Card>
    );
}
