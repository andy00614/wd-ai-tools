"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Sparkles,
    RefreshCw,
    BookOpen,
    Image as ImageIcon,
    ListOrdered,
    Lightbulb,
} from "lucide-react";
import { ClueQuestionCard } from "@/components/questions-game/ClueQuestionCard";
import { FillBlankQuestionCard } from "@/components/questions-game/FillBlankQuestionCard";
import { GuessImageQuestionCard } from "@/components/questions-game/GuessImageQuestionCard";
import { EventOrderQuestionCard } from "@/components/questions-game/EventOrderQuestionCard";
import toast from "react-hot-toast";
import type { Question } from "@/types/questions";

type QuestionType = "clue" | "fill-blank" | "guess-image" | "event-order";

export default function QuestionsGameTestPage() {
    const [knowledgePoint, setKnowledgePoint] = useState("");
    const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
    const [questionType, setQuestionType] = useState<QuestionType>("clue");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestion, setGeneratedQuestion] = useState<Question | null>(
        null,
    );

    // 题型配置
    const questionTypeConfig = {
        clue: {
            label: "线索题",
            icon: Lightbulb,
            color: "bg-purple-100 text-purple-800",
            description: "通过线索逐步揭示答案",
            examples: ["爱迪生", "莎士比亚", "量子力学"],
        },
        "fill-blank": {
            label: "填空题",
            icon: BookOpen,
            color: "bg-blue-100 text-blue-800",
            description: "填写句子中的空白部分",
            examples: ["牛顿第二定律", "元素周期表", "光合作用"],
        },
        "guess-image": {
            label: "看图猜X",
            icon: ImageIcon,
            color: "bg-green-100 text-green-800",
            description: "根据描述猜测答案",
            examples: ["盗梦空间", "埃菲尔铁塔", "蒙娜丽莎"],
        },
        "event-order": {
            label: "事件排序",
            icon: ListOrdered,
            color: "bg-orange-100 text-orange-800",
            description: "按正确顺序排列事件",
            examples: ["中国近代史", "计算机发展史", "宇宙演化"],
        },
    };

    const handleGenerate = async () => {
        if (!knowledgePoint.trim()) {
            toast.error("请输入知识点");
            return;
        }

        setIsGenerating(true);
        try {
            const apiPath = `/api/questions-game/generate-${questionType}`;
            const response = await fetch(apiPath, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    knowledgePoint: knowledgePoint.trim(),
                    difficulty,
                    language: "zh",
                }),
            });

            const result = (await response.json()) as {
                success: boolean;
                data?: Question;
                error?: string;
            };

            if (!result.success || !result.data) {
                throw new Error(result.error || "生成失败");
            }

            setGeneratedQuestion(result.data);
            toast.success(
                `${questionTypeConfig[questionType].label}生成成功！`,
            );
        } catch (error) {
            console.error("Generate error:", error);
            toast.error(
                error instanceof Error ? error.message : "生成失败，请稍后重试",
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleQuickTest = (preset: string) => {
        setKnowledgePoint(preset);
    };

    const handleReset = () => {
        setGeneratedQuestion(null);
        setKnowledgePoint("");
        setDifficulty(2);
    };

    // 渲染对应题型的组件
    const renderQuestionCard = () => {
        if (!generatedQuestion) return null;

        switch (generatedQuestion.type) {
            case "clue":
                return <ClueQuestionCard question={generatedQuestion} />;
            case "fill-blank":
                return <FillBlankQuestionCard question={generatedQuestion} />;
            case "guess-image":
                return <GuessImageQuestionCard question={generatedQuestion} />;
            case "event-order":
                return <EventOrderQuestionCard question={generatedQuestion} />;
            default:
                return null;
        }
    };

    const currentConfig = questionTypeConfig[questionType];
    const Icon = currentConfig.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                        <Sparkles className="w-8 h-8 text-primary" />
                        AI 题目生成器
                    </h1>
                    <p className="text-muted-foreground">
                        输入知识点，AI 将自动生成趣味题目 - 支持 4 种题型
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Input Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Question Type Selector */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    选择题型
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2">
                                {(
                                    Object.entries(questionTypeConfig) as Array<
                                        [
                                            QuestionType,
                                            (typeof questionTypeConfig)[QuestionType],
                                        ]
                                    >
                                ).map(([type, config]) => {
                                    const TypeIcon = config.icon;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setQuestionType(type);
                                                setGeneratedQuestion(null);
                                            }}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                questionType === type
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <TypeIcon className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    {config.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {config.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Icon className="w-5 h-5" />
                                    生成配置
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Knowledge Point Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="knowledge-point">
                                        知识点
                                    </Label>
                                    <Input
                                        id="knowledge-point"
                                        placeholder={`例如：${currentConfig.examples[0]}...`}
                                        value={knowledgePoint}
                                        onChange={(e) =>
                                            setKnowledgePoint(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                !isGenerating
                                            ) {
                                                handleGenerate();
                                            }
                                        }}
                                    />
                                </div>

                                {/* Difficulty Select */}
                                <div className="space-y-2">
                                    <Label htmlFor="difficulty">难度</Label>
                                    <Select
                                        value={difficulty.toString()}
                                        onValueChange={(value) =>
                                            setDifficulty(
                                                Number.parseInt(value, 10) as
                                                    | 1
                                                    | 2
                                                    | 3,
                                            )
                                        }
                                    >
                                        <SelectTrigger id="difficulty">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">
                                                简单
                                            </SelectItem>
                                            <SelectItem value="2">
                                                中等
                                            </SelectItem>
                                            <SelectItem value="3">
                                                困难
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Generate Button */}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={
                                        isGenerating || !knowledgePoint.trim()
                                    }
                                    className="w-full"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            生成中...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            生成{currentConfig.label}
                                        </>
                                    )}
                                </Button>

                                {generatedQuestion && (
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        重新开始
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Test Presets */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    快速测试 - {currentConfig.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {currentConfig.examples.map((preset) => (
                                        <Button
                                            key={preset}
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleQuickTest(preset)
                                            }
                                            className="text-xs"
                                        >
                                            {preset}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Question Display */}
                    <div className="lg:col-span-2">
                        {generatedQuestion ? (
                            <div className="space-y-4">
                                {/* Type Badge */}
                                <div className="flex items-center gap-2">
                                    <Badge
                                        className={currentConfig.color}
                                        variant="secondary"
                                    >
                                        <Icon className="w-3 h-3 mr-1" />
                                        {currentConfig.label}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {generatedQuestion.knowledgePoint}
                                    </span>
                                </div>
                                {renderQuestionCard()}
                            </div>
                        ) : (
                            <Card className="h-full">
                                <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                    <Icon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground mb-2">
                                        等待生成 - {currentConfig.label}
                                    </p>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        {currentConfig.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-4">
                                        在左侧输入知识点并点击"生成
                                        {currentConfig.label}
                                        "按钮
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Debug Info (Dev only) */}
                {process.env.NODE_ENV === "development" &&
                    generatedQuestion && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-sm text-muted-foreground">
                                    Debug Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(generatedQuestion, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
            </div>
        </div>
    );
}
