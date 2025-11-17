"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { MatchingQuestion } from "@/types/questions";

interface MatchingQuestionCardProps {
    question: MatchingQuestion;
    onComplete?: (isCorrect: boolean) => void;
}

type UserPair = {
    leftId: string;
    rightId: string;
};

export function MatchingQuestionCard({
    question,
    onComplete,
}: MatchingQuestionCardProps) {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [userPairs, setUserPairs] = useState<UserPair[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [score, setScore] = useState<number | null>(null);

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

    const handleLeftItemClick = (leftId: string) => {
        if (isSubmitted) return;

        // 如果已经有配对，则取消选中并删除配对
        const existingPair = userPairs.find((pair) => pair.leftId === leftId);
        if (existingPair) {
            setUserPairs(userPairs.filter((pair) => pair.leftId !== leftId));
            setSelectedLeft(null);
            return;
        }

        setSelectedLeft(leftId);
    };

    const handleRightItemClick = (rightId: string) => {
        if (isSubmitted || !selectedLeft) return;

        // 检查这个右侧项是否已经被配对
        const existingPair = userPairs.find((pair) => pair.rightId === rightId);
        if (existingPair) {
            toast.error("该项已被配对");
            return;
        }

        // 创建新配对
        setUserPairs([...userPairs, { leftId: selectedLeft, rightId }]);
        setSelectedLeft(null);
    };

    const handleSubmit = () => {
        // 检查是否所有项都已配对
        if (userPairs.length < question.leftItems.length) {
            toast.error("请完成所有配对");
            return;
        }

        // 计算正确配对数量
        let correctCount = 0;
        for (const userPair of userPairs) {
            const isCorrect = question.correctPairs.some(
                (correctPair) =>
                    correctPair.leftId === userPair.leftId &&
                    correctPair.rightId === userPair.rightId,
            );
            if (isCorrect) {
                correctCount++;
            }
        }

        const calculatedScore = Math.round(
            (correctCount / question.correctPairs.length) * 100,
        );
        setScore(calculatedScore);
        setIsSubmitted(true);

        if (calculatedScore === 100) {
            toast.success("🎉 全部答对了！");
            if (onComplete) {
                onComplete(true);
            }
        } else {
            toast.error(
                `答对了 ${correctCount} / ${question.correctPairs.length}`,
            );
            if (onComplete) {
                onComplete(false);
            }
        }
    };

    const handleReset = () => {
        setSelectedLeft(null);
        setUserPairs([]);
        setIsSubmitted(false);
        setShowHints(false);
        setScore(null);
    };

    const getLeftItemContent = (itemId: string) => {
        return question.leftItems.find((item) => item.id === itemId)?.content;
    };

    const getRightItemContent = (itemId: string) => {
        return question.rightItems.find((item) => item.id === itemId)?.content;
    };

    const isPairCorrect = (leftId: string, rightId: string): boolean => {
        return question.correctPairs.some(
            (pair) => pair.leftId === leftId && pair.rightId === rightId,
        );
    };

    const isLeftItemPaired = (leftId: string): boolean => {
        return userPairs.some((pair) => pair.leftId === leftId);
    };

    const isRightItemPaired = (rightId: string): boolean => {
        return userPairs.some((pair) => pair.rightId === rightId);
    };

    const getRightPairForLeft = (leftId: string): string | null => {
        const pair = userPairs.find((p) => p.leftId === leftId);
        return pair ? pair.rightId : null;
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">配对题</CardTitle>
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

                <p className="text-sm text-muted-foreground">
                    {question.knowledgePoint}
                </p>

                <div className="flex gap-2 flex-wrap mt-2">
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

            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    点击左侧项，再点击右侧对应项进行配对
                </p>

                {/* 配对区域 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 左侧列表 */}
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm text-muted-foreground mb-3">
                            左侧项
                        </h3>
                        {question.leftItems.map((item) => {
                            const isPaired = isLeftItemPaired(item.id);
                            const isSelected = selectedLeft === item.id;
                            const rightPairId = getRightPairForLeft(item.id);
                            const showCorrectness =
                                isSubmitted && rightPairId !== null;
                            const isCorrectPair =
                                showCorrectness &&
                                isPairCorrect(item.id, rightPairId!);

                            return (
                                <Button
                                    key={item.id}
                                    variant={isSelected ? "default" : "outline"}
                                    className={cn(
                                        "w-full justify-start text-left h-auto py-3",
                                        isPaired && !isSelected && "opacity-70",
                                        showCorrectness &&
                                            isCorrectPair &&
                                            "border-green-500 bg-green-50",
                                        showCorrectness &&
                                            !isCorrectPair &&
                                            "border-red-500 bg-red-50",
                                    )}
                                    onClick={() => handleLeftItemClick(item.id)}
                                >
                                    {item.content}
                                </Button>
                            );
                        })}
                    </div>

                    {/* 右侧列表 */}
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm text-muted-foreground mb-3">
                            右侧项
                        </h3>
                        {question.rightItems.map((item) => {
                            const isPaired = isRightItemPaired(item.id);

                            return (
                                <Button
                                    key={item.id}
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left h-auto py-3",
                                        isPaired && "opacity-70",
                                        selectedLeft && "hover:bg-primary/10",
                                    )}
                                    onClick={() =>
                                        handleRightItemClick(item.id)
                                    }
                                    disabled={
                                        isSubmitted ||
                                        (!selectedLeft && !isPaired)
                                    }
                                >
                                    {item.content}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* 当前配对显示 */}
                {userPairs.length > 0 && !isSubmitted && (
                    <div className="border rounded-lg p-3 bg-muted/30">
                        <h4 className="text-sm font-medium mb-2">
                            当前配对 ({userPairs.length}/
                            {question.leftItems.length})
                        </h4>
                        <div className="space-y-1 text-sm">
                            {userPairs.map((pair, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    <span className="text-muted-foreground">
                                        {getLeftItemContent(pair.leftId)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        →
                                    </span>
                                    <span className="text-muted-foreground">
                                        {getRightItemContent(pair.rightId)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 提示按钮 */}
                {question.hints && question.hints.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHints(!showHints)}
                        className="gap-2"
                    >
                        <Lightbulb className="w-4 h-4" />
                        {showHints ? "隐藏提示" : "查看提示"}
                    </Button>
                )}

                {/* 提示内容 */}
                {showHints && question.hints && (
                    <div className="border-l-4 border-yellow-400 bg-yellow-50 p-3 rounded">
                        <div className="space-y-1 text-sm">
                            {question.hints.map((hint, index) => (
                                <p key={index} className="text-yellow-900">
                                    {hint}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* 结果显示 */}
                {isSubmitted && score !== null && (
                    <div
                        className={cn(
                            "border rounded-lg p-4",
                            score === 100
                                ? "bg-green-50 border-green-200"
                                : "bg-orange-50 border-orange-200",
                        )}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles
                                className={cn(
                                    "w-5 h-5",
                                    score === 100
                                        ? "text-green-600"
                                        : "text-orange-600",
                                )}
                            />
                            <h3 className="font-medium">
                                {score === 100 ? "🎉 答对了！" : "部分正确"}
                            </h3>
                        </div>
                        <p className="text-sm mb-2">得分: {score}%</p>

                        {question.explanation && (
                            <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium mb-1">
                                    解析:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {question.explanation}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2">
                    {!isSubmitted ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                userPairs.length < question.leftItems.length
                            }
                            className="flex-1"
                        >
                            提交答案
                        </Button>
                    ) : (
                        <Button onClick={handleReset} className="flex-1">
                            重新尝试
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
