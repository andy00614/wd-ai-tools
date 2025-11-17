"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, PenLine, Image as ImageIcon, ArrowDownUp } from "lucide-react";
import type { GeneratedQuestion } from "../types/knowledge-point";

interface QuestionPreviewCardProps {
    question: GeneratedQuestion;
    index: number;
}

const questionTypeIcons: Record<GeneratedQuestion["type"], React.ReactNode> = {
    clue: <Search className="h-4 w-4" />,
    "fill-blank": <PenLine className="h-4 w-4" />,
    "guess-image": <ImageIcon className="h-4 w-4" />,
    "event-order": <ArrowDownUp className="h-4 w-4" />,
};

const questionTypeLabels: Record<GeneratedQuestion["type"], string> = {
    clue: "线索题",
    "fill-blank": "填空题",
    "guess-image": "看图猜X",
    "event-order": "事件排序",
};

export function QuestionPreviewCard({
    question,
    index,
}: QuestionPreviewCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-sm font-bold">
                            {index + 1}
                        </span>
                        <span>{question.knowledgePoint}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            {questionTypeIcons[question.type]}
                            <span className="ml-1">
                                {questionTypeLabels[question.type]}
                            </span>
                        </Badge>
                        <Badge variant="outline">
                            {"⭐".repeat(question.difficulty)}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Render different content based on question type */}
                {question.type === "clue" && (
                    <ClueQuestionPreview question={question} />
                )}
                {question.type === "fill-blank" && (
                    <FillBlankQuestionPreview question={question} />
                )}
                {question.type === "guess-image" && (
                    <GuessImageQuestionPreview question={question} />
                )}
                {question.type === "event-order" && (
                    <EventOrderQuestionPreview question={question} />
                )}

                {/* Answer section */}
                <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-semibold text-muted-foreground">
                        答案
                    </p>
                    <p className="mt-1 font-semibold">
                        {question.type === "fill-blank"
                            ? question.blanks.map((b) => b.answer).join(", ")
                            : question.type === "event-order"
                              ? question.correctOrder.join(" → ")
                              : question.answer}
                    </p>
                </div>

                {/* Explanation */}
                {question.explanation && (
                    <div className="text-sm text-muted-foreground">
                        <p className="font-semibold">解析：</p>
                        <p className="mt-1">{question.explanation}</p>
                    </div>
                )}

                {/* Tags */}
                {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {question.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ClueQuestionPreview({
    question,
}: {
    question: Extract<GeneratedQuestion, { type: "clue" }>;
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold">线索提示：</p>
            <ol className="space-y-2">
                {question.clues.map((clue, idx) => (
                    <li
                        key={idx}
                        className="flex gap-2 text-sm bg-accent/50 p-2 rounded"
                    >
                        <span className="font-semibold text-muted-foreground">
                            {idx + 1}.
                        </span>
                        <span>{clue}</span>
                    </li>
                ))}
            </ol>
            {question.hints && question.hints.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                    <p className="font-semibold">额外提示：</p>
                    {question.hints.map((hint, idx) => (
                        <p key={idx} className="mt-1">
                            {hint}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

function FillBlankQuestionPreview({
    question,
}: {
    question: Extract<GeneratedQuestion, { type: "fill-blank" }>;
}) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-semibold mb-2">题目：</p>
                <p className="text-base bg-accent/50 p-3 rounded">
                    {question.sentence}
                </p>
            </div>
            {question.options && question.options.length > 0 && (
                <div>
                    <p className="text-sm font-semibold mb-2">选项：</p>
                    <div className="grid grid-cols-2 gap-2">
                        {question.options.map((option, idx) => (
                            <div
                                key={idx}
                                className="text-sm bg-accent/30 p-2 rounded"
                            >
                                {String.fromCharCode(65 + idx)}. {option}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div>
                <p className="text-sm font-semibold mb-2">空格答案：</p>
                {question.blanks.map((blank, idx) => (
                    <p key={idx} className="text-sm">
                        空格 {blank.position + 1}:{" "}
                        <span className="font-semibold">{blank.answer}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

function GuessImageQuestionPreview({
    question,
}: {
    question: Extract<GeneratedQuestion, { type: "guess-image" }>;
}) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-semibold mb-2">描述：</p>
                <p className="text-base bg-accent/50 p-3 rounded">
                    {question.description}
                </p>
            </div>
            {question.imageUrl && (
                <div>
                    <p className="text-sm font-semibold mb-2">图片：</p>
                    <div className="rounded overflow-hidden border border-border">
                        <img
                            src={question.imageUrl}
                            alt="Question"
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            )}
            {question.hints && question.hints.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    <p className="font-semibold">提示：</p>
                    {question.hints.map((hint, idx) => (
                        <p key={idx} className="mt-1">
                            {hint}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

function EventOrderQuestionPreview({
    question,
}: {
    question: Extract<GeneratedQuestion, { type: "event-order" }>;
}) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-semibold mb-2">事件列表：</p>
                <div className="space-y-2">
                    {question.events.map((event) => (
                        <div
                            key={event.id}
                            className="flex items-center gap-2 bg-accent/50 p-2 rounded text-sm"
                        >
                            <Badge variant="outline" className="text-xs">
                                {event.id}
                            </Badge>
                            <span>{event.description}</span>
                            {event.year && (
                                <span className="ml-auto text-muted-foreground">
                                    {event.year}年
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <p className="text-sm font-semibold mb-2">正确顺序：</p>
                <div className="flex items-center gap-2">
                    {question.correctOrder.map((eventId, idx) => (
                        <div key={eventId} className="flex items-center">
                            <Badge variant="secondary">{eventId}</Badge>
                            {idx < question.correctOrder.length - 1 && (
                                <ArrowDownUp className="h-3 w-3 mx-1 text-muted-foreground" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
