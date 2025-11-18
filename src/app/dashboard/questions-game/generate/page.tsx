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
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { KnowledgeInputFormStream } from "@/modules/question-generator/components/knowledge-input-form-stream";
import { KnowledgeTree } from "@/modules/question-generator/components/knowledge-tree";
import { QuestionCardWithPrompt } from "@/modules/question-generator/components/question-card-with-prompt";
import { PipelineLogsStream } from "@/modules/question-generator/components/pipeline-logs-stream";
import { adaptQuestionsToPlayable } from "@/modules/question-generator/utils/question-adapter";
import type {
    QuestionGenerationResult,
    PipelineLog,
} from "@/modules/question-generator/models/question-generator.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function QuestionGeneratorPage() {
    const [result, setResult] = useState<QuestionGenerationResult | null>(null);
    const [selectedType, setSelectedType] = useState<string>("all");
    const [completedQuestions, setCompletedQuestions] = useState<
        Record<string, boolean>
    >({});
    const [pipelineLogs, setPipelineLogs] = useState<PipelineLog[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    // Streaming state - partial results
    const [streamingQuestions, setStreamingQuestions] = useState<any[]>([]);
    const [streamingMetadata, setStreamingMetadata] = useState<any[]>([]);
    const [knowledgeBreakdown, setKnowledgeBreakdown] = useState<any>(null);

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

    const handleLogUpdate = (logs: PipelineLog[]) => {
        setPipelineLogs(logs);

        // Extract real-time data from logs
        for (const log of logs) {
            // Knowledge breakdown
            if (
                log.step === "知识点拆解" &&
                log.status === "success" &&
                log.response
            ) {
                setKnowledgeBreakdown(log.response);
            }

            // Individual question generated
            if (
                log.step.startsWith("生成题目") &&
                log.status === "success" &&
                log.response
            ) {
                setStreamingQuestions((prev) => {
                    // Check if already added
                    if (prev.some((q) => q.id === log.response.id)) {
                        return prev;
                    }
                    return [...prev, log.response];
                });

                // Add metadata
                if (log.prompt) {
                    const questionNumber = parseInt(
                        log.step.match(/\d+/)?.[0] || "0",
                    );
                    setStreamingMetadata((prev) => {
                        const newMetadata = [...prev];
                        newMetadata[questionNumber - 1] = {
                            question: log.response,
                            metadata: {
                                prompt: log.prompt,
                                generatedAt: log.timestamp,
                                knowledgePoint: log.details?.knowledgePoint,
                            },
                        };
                        return newMetadata;
                    });
                }
            }
        }
    };

    const handleStreamingChange = (streaming: boolean) => {
        setIsStreaming(streaming);

        // Reset streaming state when starting new generation
        if (streaming) {
            setStreamingQuestions([]);
            setStreamingMetadata([]);
            setKnowledgeBreakdown(null);
        }
    };

    const handleReset = () => {
        setResult(null);
        setSelectedType("all");
        setCompletedQuestions({});
        setPipelineLogs([]);
        setStreamingQuestions([]);
        setStreamingMetadata([]);
        setKnowledgeBreakdown(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleQuestionComplete = (questionId: string, isCorrect: boolean) => {
        setCompletedQuestions((prev) => ({
            ...prev,
            [questionId]: isCorrect,
        }));
    };

    // Use streaming questions if available, otherwise use final result
    const currentQuestions = useMemo(() => {
        if (isStreaming || streamingQuestions.length > 0) {
            return streamingQuestions;
        }
        return result?.questions || [];
    }, [isStreaming, streamingQuestions, result]);

    const currentMetadata = useMemo(() => {
        if (isStreaming || streamingMetadata.length > 0) {
            return streamingMetadata;
        }
        return result?.questionsWithMetadata || [];
    }, [isStreaming, streamingMetadata, result]);

    // Convert generated questions to playable format
    const playableQuestions = useMemo(
        () => adaptQuestionsToPlayable(currentQuestions),
        [currentQuestions],
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

    // Show results section if streaming or has result
    const showResults = isStreaming || result !== null;

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl py-4 px-4">
                {/* Header */}
                <div className="mb-4">
                    <Link href="/dashboard/questions-game">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-3 hover:bg-muted/50 -ml-2 h-8"
                        >
                            <ArrowLeft className="mr-1 h-3 w-3" />
                            <span className="text-sm">返回</span>
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold">AI 题目生成器</h1>
                        <p className="text-sm text-muted-foreground">
                            输入知识点，快速生成题目
                        </p>
                    </div>
                </div>

                {/* Input Form */}
                <div className="mb-6">
                    <KnowledgeInputFormStream
                        onGenerated={handleGenerated}
                        onLogUpdate={handleLogUpdate}
                        onStreamingChange={handleStreamingChange}
                    />
                </div>

                {/* Two Column Layout: Content Left, Logs Right */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                    {/* Left Column: Main Content */}
                    <div className="min-w-0">
                        {/* Results Section - Show during streaming or after completion */}
                        {showResults && (
                            <div id="results-section" className="space-y-4">
                                <Separator className="my-3" />

                                {/* Progress Stats */}
                                <Card className="border">
                                    <CardContent className="p-3">
                                        <div className="grid grid-cols-4 gap-3 mb-3">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                                    状态
                                                </p>
                                                <p className="text-lg font-bold">
                                                    {isStreaming ? (
                                                        <span className="text-blue-500 flex items-center gap-1">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            生成中
                                                        </span>
                                                    ) : result ? (
                                                        `${(result.generationTime / 1000).toFixed(1)}s`
                                                    ) : (
                                                        "-"
                                                    )}
                                                </p>
                                            </div>

                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                                    总数
                                                </p>
                                                <p className="text-lg font-bold">
                                                    {totalQuestions}
                                                    <span className="text-xs text-muted-foreground ml-0.5">
                                                        题
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                                    完成
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    <p className="text-lg font-bold">
                                                        {completedCount}
                                                        <span className="text-xs text-muted-foreground">
                                                            /{totalQuestions}
                                                        </span>
                                                    </p>
                                                    {completedCount ===
                                                        totalQuestions &&
                                                        totalQuestions > 0 && (
                                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                                        )}
                                                </div>
                                            </div>

                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                                    正确率
                                                </p>
                                                <p
                                                    className={`text-lg font-bold ${
                                                        accuracy >= 80
                                                            ? "text-green-500"
                                                            : accuracy >= 60
                                                              ? "text-yellow-500"
                                                              : completedCount >
                                                                  0
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
                                            className="w-full h-8 text-sm hover:bg-muted"
                                            size="sm"
                                        >
                                            <RefreshCw className="mr-1.5 h-3 w-3" />
                                            重新生成
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Knowledge Breakdown */}
                                {(knowledgeBreakdown ||
                                    result?.knowledgeBreakdown) && (
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-bold">
                                            知识点拆解
                                        </h2>
                                        <KnowledgeTree
                                            breakdown={
                                                knowledgeBreakdown ||
                                                result?.knowledgeBreakdown
                                            }
                                        />
                                    </div>
                                )}

                                <Separator className="my-3" />

                                {/* Question Filter */}
                                {totalQuestions > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                题目列表
                                                {isStreaming && (
                                                    <span className="text-sm text-muted-foreground font-normal">
                                                        (实时生成中...)
                                                    </span>
                                                )}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Filter className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    筛选：
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Button
                                                        variant={
                                                            selectedType ===
                                                            "all"
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedType(
                                                                "all",
                                                            )
                                                        }
                                                        className="h-7 text-xs"
                                                    >
                                                        全部 ({totalQuestions})
                                                    </Button>
                                                    {Object.entries(
                                                        questionTypeCounts,
                                                    ).map(([type, count]) => (
                                                        <Button
                                                            key={type}
                                                            variant={
                                                                selectedType ===
                                                                type
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelectedType(
                                                                    type,
                                                                )
                                                            }
                                                            className="h-7 text-xs"
                                                        >
                                                            {getTypeLabel(type)}{" "}
                                                            ({count})
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Questions Grid */}
                                        <div className="space-y-4">
                                            {filteredQuestions.length > 0 ? (
                                                filteredQuestions.map(
                                                    (question, index) => (
                                                        <div
                                                            key={question.id}
                                                            className="relative group"
                                                        >
                                                            {/* Question Number Badge */}
                                                            <div className="absolute -left-2 top-3 z-10">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold shadow-sm">
                                                                    {index + 1}
                                                                </div>
                                                            </div>

                                                            {/* Question Status Badge */}
                                                            {completedQuestions[
                                                                question.id
                                                            ] !== undefined && (
                                                                <div className="absolute -top-2 -right-2 z-10">
                                                                    {completedQuestions[
                                                                        question
                                                                            .id
                                                                    ] ? (
                                                                        <Badge className="bg-green-500 hover:bg-green-600 shadow-sm px-2 py-0.5 text-xs font-semibold">
                                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                                            ✓
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge
                                                                            variant="destructive"
                                                                            className="bg-red-500 hover:bg-red-600 shadow-sm px-2 py-0.5 text-xs font-semibold"
                                                                        >
                                                                            <XCircle className="h-3 w-3 mr-1" />
                                                                            ✗
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="ml-4">
                                                                <QuestionCardWithPrompt
                                                                    question={
                                                                        question
                                                                    }
                                                                    questionNumber={
                                                                        index +
                                                                        1
                                                                    }
                                                                    onComplete={(
                                                                        isCorrect,
                                                                    ) =>
                                                                        handleQuestionComplete(
                                                                            question.id,
                                                                            isCorrect,
                                                                        )
                                                                    }
                                                                    prompt={
                                                                        currentMetadata[
                                                                            index
                                                                        ]
                                                                            ?.metadata
                                                                            ?.prompt
                                                                    }
                                                                    knowledgePoint={
                                                                        currentMetadata[
                                                                            index
                                                                        ]
                                                                            ?.metadata
                                                                            ?.knowledgePoint
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <Card className="border-2 border-dashed">
                                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                                        <div className="text-4xl mb-2">
                                                            🔍
                                                        </div>
                                                        <h3 className="text-sm font-semibold mb-1">
                                                            该类型没有题目
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            请选择其他类型查看题目
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty State */}
                        {!showResults && (
                            <Card className="border-2 border-dashed">
                                <CardContent className="flex flex-col items-center text-center py-8 px-4">
                                    <div className="max-w-2xl mx-auto space-y-3">
                                        <div className="text-4xl mb-2">🎯</div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-lg font-bold text-foreground">
                                                开始测试
                                            </h3>
                                            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                                                输入知识点，AI 快速生成题目
                                            </p>
                                        </div>
                                        <div className="pt-3 space-y-2">
                                            <p className="text-xs font-semibold text-foreground uppercase">
                                                示例
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-1.5">
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
                                                        className="cursor-pointer hover:bg-secondary/80 px-2 py-1 text-xs font-medium"
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

                    {/* Right Column: Sticky Pipeline Logs */}
                    <div className="hidden lg:block">
                        {pipelineLogs.length > 0 && (
                            <div className="sticky top-4">
                                <PipelineLogsStream
                                    logs={pipelineLogs}
                                    isStreaming={isStreaming}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile: Show logs below on small screens */}
                {pipelineLogs.length > 0 && (
                    <div className="lg:hidden mt-6">
                        <PipelineLogsStream
                            logs={pipelineLogs}
                            isStreaming={isStreaming}
                        />
                    </div>
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
