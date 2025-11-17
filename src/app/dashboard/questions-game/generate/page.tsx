"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Filter,
    RefreshCw,
    CheckCircle,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { KnowledgeInputForm } from "@/modules/question-generator/components/knowledge-input-form";
import { KnowledgeTree } from "@/modules/question-generator/components/knowledge-tree";
import { PlayableQuestionCard } from "@/modules/question-generator/components/playable-question-card";
import { adaptQuestionsToPlayable } from "@/modules/question-generator/utils/question-adapter";
import type { QuestionGenerationResult } from "@/modules/question-generator/models/question-generator.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function QuestionGeneratorPage() {
    const [result, setResult] = useState<QuestionGenerationResult | null>(null);
    const [selectedType, setSelectedType] = useState<string>("all");
    const [completedQuestions, setCompletedQuestions] = useState<
        Record<string, boolean>
    >({});

    const handleGenerated = (generatedResult: QuestionGenerationResult) => {
        setResult(generatedResult);
        setSelectedType("all");
        setCompletedQuestions({});
        // Scroll to results
        setTimeout(() => {
            document
                .getElementById("results-section")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleReset = () => {
        setResult(null);
        setSelectedType("all");
        setCompletedQuestions({});
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleQuestionComplete = (questionId: string, isCorrect: boolean) => {
        setCompletedQuestions((prev) => ({
            ...prev,
            [questionId]: isCorrect,
        }));
    };

    // Convert generated questions to playable format
    const playableQuestions = useMemo(
        () => (result ? adaptQuestionsToPlayable(result.questions) : []),
        [result],
    );

    const filteredQuestions =
        selectedType !== "all"
            ? playableQuestions.filter((q) => q.type === selectedType)
            : playableQuestions;

    const questionTypeCounts =
        playableQuestions.reduce(
            (acc, q) => {
                acc[q.type] = (acc[q.type] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        ) || {};

    // Calculate progress stats
    const totalQuestions = playableQuestions.length;
    const completedCount = Object.keys(completedQuestions).length;
    const correctCount = Object.values(completedQuestions).filter(
        (isCorrect) => isCorrect,
    ).length;
    const accuracy =
        completedCount > 0
            ? Math.round((correctCount / completedCount) * 100)
            : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container max-w-6xl py-8 px-4 md:px-6">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/dashboard/questions-game">
                        <Button
                            variant="ghost"
                            className="mb-6 hover:bg-muted/50 -ml-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            返回题目游戏
                        </Button>
                    </Link>
                    <div className="space-y-3">
                        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            AI 题目生成器
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl">
                            输入任意知识点，AI
                            将智能拆解并生成多种类型的趣味题目
                        </p>
                    </div>
                </div>

                {/* Input Form */}
                <div className="mb-16">
                    <KnowledgeInputForm onGenerated={handleGenerated} />
                </div>

                {/* Results Section */}
                {result && (
                    <div id="results-section" className="space-y-10">
                        <Separator className="my-8" />

                        {/* Progress Stats */}
                        <Card className="shadow-lg border-2">
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            生成耗时
                                        </p>
                                        <p className="text-3xl font-bold">
                                            {(
                                                result.generationTime / 1000
                                            ).toFixed(1)}
                                            <span className="text-lg text-muted-foreground ml-1">
                                                s
                                            </span>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            题目总数
                                        </p>
                                        <p className="text-3xl font-bold">
                                            {totalQuestions}
                                            <span className="text-lg text-muted-foreground ml-1">
                                                题
                                            </span>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            已完成
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-3xl font-bold">
                                                {completedCount}
                                                <span className="text-lg text-muted-foreground">
                                                    /{totalQuestions}
                                                </span>
                                            </p>
                                            {completedCount ===
                                                totalQuestions &&
                                                totalQuestions > 0 && (
                                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                                )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            正确率
                                        </p>
                                        <p
                                            className={`text-3xl font-bold ${
                                                accuracy >= 80
                                                    ? "text-green-500"
                                                    : accuracy >= 60
                                                      ? "text-yellow-500"
                                                      : completedCount > 0
                                                        ? "text-red-500"
                                                        : "text-muted-foreground"
                                            }`}
                                        >
                                            {completedCount > 0
                                                ? `${accuracy}%`
                                                : "-"}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="w-full h-12 text-base font-semibold hover:bg-muted"
                                    size="lg"
                                >
                                    <RefreshCw className="mr-2 h-5 w-5" />
                                    重新生成题目
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Knowledge Breakdown */}
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold">知识点拆解</h2>
                            <KnowledgeTree
                                breakdown={result.knowledgeBreakdown}
                            />
                        </div>

                        <Separator className="my-8" />

                        {/* Question Filter */}
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-3xl font-bold">
                                    生成的题目
                                </h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Filter className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        筛选类型：
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant={
                                                selectedType === "all"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                setSelectedType("all")
                                            }
                                            className="h-9 font-medium"
                                        >
                                            全部 ({result.totalGenerated})
                                        </Button>
                                        {Object.entries(questionTypeCounts).map(
                                            ([type, count]) => (
                                                <Button
                                                    key={type}
                                                    variant={
                                                        selectedType === type
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedType(type)
                                                    }
                                                    className="h-9 font-medium"
                                                >
                                                    {getTypeLabel(type)} (
                                                    {count})
                                                </Button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Questions Grid */}
                            <div className="space-y-8">
                                {filteredQuestions.length > 0 ? (
                                    filteredQuestions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="relative group"
                                        >
                                            {/* Question Number Badge */}
                                            <div className="absolute -left-3 top-6 z-10">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md group-hover:shadow-lg transition-shadow">
                                                    {index + 1}
                                                </div>
                                            </div>

                                            {/* Question Status Badge */}
                                            {completedQuestions[question.id] !==
                                                undefined && (
                                                <div className="absolute -top-3 -right-3 z-10">
                                                    {completedQuestions[
                                                        question.id
                                                    ] ? (
                                                        <Badge className="bg-green-500 hover:bg-green-600 shadow-md px-3 py-1.5 text-sm font-semibold">
                                                            <CheckCircle className="h-4 w-4 mr-1.5" />
                                                            正确
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="destructive"
                                                            className="bg-red-500 hover:bg-red-600 shadow-md px-3 py-1.5 text-sm font-semibold"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1.5" />
                                                            错误
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            <div className="ml-6">
                                                <PlayableQuestionCard
                                                    question={question}
                                                    questionNumber={index + 1}
                                                    onComplete={(isCorrect) =>
                                                        handleQuestionComplete(
                                                            question.id,
                                                            isCorrect,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <Card className="border-2 border-dashed">
                                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="text-6xl mb-4">
                                                🔍
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">
                                                该类型没有题目
                                            </h3>
                                            <p className="text-muted-foreground">
                                                请选择其他类型查看题目
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!result && (
                    <Card className="border-2 border-dashed shadow-lg">
                        <CardContent className="flex flex-col items-center text-center py-20 px-6">
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="text-8xl mb-4">🎯</div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-bold text-foreground">
                                        开始你的学习之旅
                                    </h3>
                                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                                        在上方输入任何你想学习的知识点，AI
                                        将智能拆解并为你生成一套完整的趣味题目
                                    </p>
                                </div>
                                <div className="pt-6 space-y-4">
                                    <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                                        示例知识点
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {[
                                            "中国近代史",
                                            "牛顿三大定律",
                                            "编程语言发展史",
                                            "世界名画",
                                            "古代四大发明",
                                        ].map((example) => (
                                            <Badge
                                                key={example}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-secondary/80 px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                                            >
                                                {example}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        clue: "线索题",
        "fill-blank": "填空题",
        "guess-image": "看图猜X",
        "event-order": "事件排序",
    };
    return labels[type] || type;
}
