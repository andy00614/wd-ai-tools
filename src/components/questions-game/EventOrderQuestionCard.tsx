"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    Lightbulb,
    ArrowUp,
    ArrowDown,
    ListOrdered,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { EventOrderQuestion } from "@/types/questions";

interface EventOrderQuestionCardProps {
    question: EventOrderQuestion;
    onComplete?: (isCorrect: boolean) => void;
}

export function EventOrderQuestionCard({
    question,
    onComplete,
}: EventOrderQuestionCardProps) {
    const [currentOrder, setCurrentOrder] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showHints, setShowHints] = useState(false);
    const [wrongPositions, setWrongPositions] = useState<Set<number>>(
        new Set(),
    );

    // 初始化：打乱事件顺序
    useEffect(() => {
        const shuffled = [...question.events]
            .map((event) => event.id)
            .sort(() => Math.random() - 0.5);
        setCurrentOrder(shuffled);
    }, [question.events]);

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

    const moveEvent = (index: number, direction: "up" | "down") => {
        const newOrder = [...currentOrder];
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newOrder.length) {
            return;
        }

        // 交换位置
        [newOrder[index], newOrder[targetIndex]] = [
            newOrder[targetIndex],
            newOrder[index],
        ];
        setCurrentOrder(newOrder);
    };

    const handleSubmit = () => {
        // 检查顺序是否正确
        const correct =
            JSON.stringify(currentOrder) ===
            JSON.stringify(question.correctOrder);

        // 找出错误的位置
        const wrong = new Set<number>();
        currentOrder.forEach((eventId, index) => {
            if (eventId !== question.correctOrder[index]) {
                wrong.add(index);
            }
        });

        setIsCorrect(correct);
        setWrongPositions(wrong);
        setIsSubmitted(true);

        if (correct) {
            toast.success("完全正确！");
            if (onComplete) {
                onComplete(true);
            }
        } else {
            toast.error(
                `排序有误，${currentOrder.length - wrong.size}/${currentOrder.length} 个位置正确`,
            );
            if (onComplete) {
                onComplete(false);
            }
        }
    };

    const handleReset = () => {
        const shuffled = [...question.events]
            .map((event) => event.id)
            .sort(() => Math.random() - 0.5);
        setCurrentOrder(shuffled);
        setIsSubmitted(false);
        setIsCorrect(null);
        setShowHints(false);
        setWrongPositions(new Set());
    };

    const handleShuffle = () => {
        const shuffled = [...currentOrder].sort(() => Math.random() - 0.5);
        setCurrentOrder(shuffled);
    };

    const getEventById = (id: string) => {
        return question.events.find((e) => e.id === id);
    };

    const correctCount = currentOrder.length - wrongPositions.size;
    const score = isSubmitted
        ? Math.round((correctCount / currentOrder.length) * 100)
        : 0;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ListOrdered className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">事件排序题</CardTitle>
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
                {/* Instructions */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                        💡
                        请将下列事件按照正确的时间顺序排列（使用箭头按钮调整顺序）
                    </p>
                </div>

                {/* Events List */}
                <div className="space-y-2">
                    {currentOrder.map((eventId, index) => {
                        const event = getEventById(eventId);
                        if (!event) return null;

                        const isWrong = wrongPositions.has(index);
                        const isCorrectPosition =
                            isSubmitted && !wrongPositions.has(index);

                        return (
                            <div
                                key={eventId}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                                    isSubmitted && isCorrectPosition
                                        ? "border-green-500 bg-green-50"
                                        : "",
                                    isSubmitted && isWrong
                                        ? "border-red-500 bg-red-50"
                                        : "",
                                    !isSubmitted ? "border-border bg-card" : "",
                                )}
                            >
                                {/* Order Number */}
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0",
                                        isSubmitted && isCorrectPosition
                                            ? "bg-green-500 text-white"
                                            : "",
                                        isSubmitted && isWrong
                                            ? "bg-red-500 text-white"
                                            : "",
                                        !isSubmitted
                                            ? "bg-primary/10 text-primary"
                                            : "",
                                    )}
                                >
                                    {index + 1}
                                </div>

                                {/* Event Description */}
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-relaxed">
                                        {event.description}
                                    </p>
                                    {event.date && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {event.date}
                                        </p>
                                    )}
                                </div>

                                {/* Move Buttons */}
                                {!isSubmitted && (
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                moveEvent(index, "up")
                                            }
                                            disabled={index === 0}
                                            className="h-7 w-7 p-0"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                moveEvent(index, "down")
                                            }
                                            disabled={
                                                index ===
                                                currentOrder.length - 1
                                            }
                                            className="h-7 w-7 p-0"
                                        >
                                            <ArrowDown className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}

                                {/* Status Icon */}
                                {isSubmitted && (
                                    <div className="shrink-0">
                                        {isCorrectPosition ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {!isSubmitted ? (
                        <>
                            <Button
                                onClick={handleSubmit}
                                className="flex-1"
                                disabled={currentOrder.length === 0}
                            >
                                提交答案
                            </Button>
                            <Button
                                onClick={handleShuffle}
                                variant="outline"
                                className="min-w-[100px]"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                打乱
                            </Button>
                        </>
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
                            isCorrect
                                ? "bg-green-50 border-green-500"
                                : "bg-amber-50 border-amber-500",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            {isCorrect ? (
                                <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p
                                        className={cn(
                                            "font-semibold",
                                            isCorrect
                                                ? "text-green-900"
                                                : "text-amber-900",
                                        )}
                                    >
                                        {isCorrect
                                            ? "🎉 完全正确！"
                                            : "部分正确"}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="bg-white"
                                    >
                                        得分: {score}%
                                    </Badge>
                                </div>

                                {!isCorrect && (
                                    <p className="text-sm">
                                        正确顺序已在上方标出（绿色 ✓
                                        表示正确，红色 ✗ 表示错误）
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
            </CardContent>
        </Card>
    );
}
