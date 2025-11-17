"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BookOpen,
    User,
    Calendar,
    MapPin,
    Lightbulb,
    ListOrdered,
    Clock,
} from "lucide-react";
import type {
    KnowledgeBreakdown,
    KnowledgeCategory,
    QuestionType,
} from "../types/knowledge-point";

interface KnowledgeTreeProps {
    breakdown: KnowledgeBreakdown;
}

const categoryIcons: Record<KnowledgeCategory, React.ReactNode> = {
    person: <User className="h-4 w-4" />,
    event: <Calendar className="h-4 w-4" />,
    concept: <BookOpen className="h-4 w-4" />,
    place: <MapPin className="h-4 w-4" />,
    invention: <Lightbulb className="h-4 w-4" />,
    process: <ListOrdered className="h-4 w-4" />,
    time: <Clock className="h-4 w-4" />,
};

const categoryLabels: Record<KnowledgeCategory, string> = {
    person: "人物",
    event: "事件",
    concept: "概念",
    place: "地点",
    invention: "发明",
    process: "流程",
    time: "时间",
};

const questionTypeLabels: Record<QuestionType, string> = {
    clue: "线索题",
    "fill-blank": "填空题",
    "guess-image": "看图猜X",
    "event-order": "事件排序",
    matching: "配对题",
};

const questionTypeColors: Record<
    QuestionType,
    "default" | "secondary" | "destructive" | "outline"
> = {
    clue: "default",
    "fill-blank": "secondary",
    "guess-image": "outline",
    "event-order": "destructive",
    matching: "default",
};

export function KnowledgeTree({ breakdown }: KnowledgeTreeProps) {
    return (
        <Card className="shadow-md">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        {categoryIcons[breakdown.mainCategory]}
                    </div>
                    <span>知识点拆解</span>
                    <Badge variant="outline" className="ml-auto">
                        {breakdown.totalPoints} 个知识点
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Original Input Display */}
                <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted p-6 border border-border/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                        原始输入
                    </p>
                    <p className="text-xl font-bold text-foreground">
                        {breakdown.originalInput}
                    </p>
                </div>

                {/* Knowledge Points Grid */}
                <div className="space-y-4">
                    {breakdown.breakdown.map((point, index) => (
                        <div
                            key={point.id}
                            className="group relative rounded-xl border-2 border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start gap-4">
                                {/* Index Badge */}
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-lg shadow-sm">
                                    {index + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    {/* Title and Badges Row */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-lg font-bold">
                                            {point.name}
                                        </h4>
                                        <Badge
                                            variant="secondary"
                                            className="gap-1"
                                        >
                                            {categoryIcons[point.category]}
                                            <span>
                                                {categoryLabels[point.category]}
                                            </span>
                                        </Badge>
                                        {point.difficulty && (
                                            <Badge
                                                variant="outline"
                                                className="gap-1"
                                            >
                                                <span className="text-xs">
                                                    难度
                                                </span>
                                                <span className="text-sm">
                                                    {"⭐".repeat(
                                                        point.difficulty,
                                                    )}
                                                </span>
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {point.description && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {point.description}
                                        </p>
                                    )}

                                    {/* Question Types */}
                                    <div className="pt-1">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                            推荐题型
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {point.recommendedTypes.map(
                                                (type) => (
                                                    <Badge
                                                        key={type}
                                                        variant={
                                                            questionTypeColors[
                                                                type
                                                            ]
                                                        }
                                                        className="font-medium"
                                                    >
                                                        {
                                                            questionTypeLabels[
                                                                type
                                                            ]
                                                        }
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
