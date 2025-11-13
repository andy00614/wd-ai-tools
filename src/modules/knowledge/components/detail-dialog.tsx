"use client";

import { BookOpen, HelpCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatCost } from "@/lib/pricing";
import { getSessionDetail } from "../actions/get-session-detail.action";

type Props = {
    sessionId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type Question = {
    id: string;
    content: string;
    type: string;
    options: string[];
    answer: string;
    explanation: string | null;
};

type Outline = {
    id: string;
    title: string;
    orderIndex: number;
    status: string;
    questions: Question[];
};

type SessionData = {
    session: {
        id: string;
        title: string;
        model: string;
        status: string;
        timeConsume: number | null;
        inputToken: number | null;
        outputToken: number | null;
        cost: string | null;
        createdAt: Date;
    };
    outlines: Outline[];
};

export default function DetailDialog({ sessionId, open, onOpenChange }: Props) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SessionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !sessionId) {
            setData(null);
            setError(null);
            return;
        }

        async function fetchDetail() {
            if (!sessionId) return;

            setLoading(true);
            setError(null);

            const result = await getSessionDetail(sessionId);

            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || "Failed to load session");
            }

            setLoading(false);
        }

        fetchDetail();
    }, [sessionId, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[85vh] overflow-hidden flex flex-col"
                style={{ maxWidth: "60vw" }}
            >
                <DialogHeader>
                    <DialogTitle>Knowledge Session Details</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && (
                    <div className="py-8 text-center text-destructive">
                        {error}
                    </div>
                )}

                {data && (
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        {/* Session Info */}
                        <div className="space-y-2 pb-4 border-b">
                            <h2 className="font-bold text-xl">
                                {data.session.title}
                            </h2>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary">
                                    {data.session.model}
                                </Badge>
                                <Badge
                                    variant={
                                        data.session.status === "completed"
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {data.session.status}
                                </Badge>
                                {data.session.timeConsume && (
                                    <span>
                                        Time:{" "}
                                        {(
                                            data.session.timeConsume / 1000
                                        ).toFixed(2)}
                                        s
                                    </span>
                                )}
                                {data.session.inputToken && (
                                    <span>
                                        Input: {data.session.inputToken} tokens
                                    </span>
                                )}
                                {data.session.outputToken && (
                                    <span>
                                        Output: {data.session.outputToken}{" "}
                                        tokens
                                    </span>
                                )}
                                {data.session.cost && (
                                    <span className="font-mono font-semibold text-primary">
                                        Cost:{" "}
                                        {formatCost(
                                            Number.parseFloat(
                                                data.session.cost,
                                            ),
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Outlines Accordion */}
                        <Accordion type="multiple" className="w-full">
                            {data.outlines.map((outline, outlineIndex) => (
                                <AccordionItem
                                    key={outline.id}
                                    value={`outline-${outline.id}`}
                                >
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3 text-left">
                                            <BookOpen className="size-5 text-primary shrink-0" />
                                            <span className="font-semibold text-base">
                                                {outlineIndex + 1}.{" "}
                                                {outline.title}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="ml-auto mr-2 shrink-0"
                                            >
                                                {outline.questions.length}{" "}
                                                questions
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pt-2 pb-4 space-y-4">
                                            {outline.questions.length === 0 ? (
                                                <p className="text-sm text-muted-foreground ml-8">
                                                    No questions generated yet
                                                </p>
                                            ) : (
                                                outline.questions.map(
                                                    (question, qIndex) => (
                                                        <div
                                                            key={question.id}
                                                            className="ml-4 border rounded-lg p-4 space-y-3 bg-card"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <HelpCircle className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                                                                <div className="flex-1 space-y-3">
                                                                    <p className="font-medium">
                                                                        Q
                                                                        {qIndex +
                                                                            1}
                                                                        :{" "}
                                                                        {
                                                                            question.content
                                                                        }
                                                                    </p>

                                                                    {/* Options */}
                                                                    <div className="space-y-2">
                                                                        {question.options.map(
                                                                            (
                                                                                option,
                                                                                optIndex,
                                                                            ) => {
                                                                                const isCorrect =
                                                                                    option.startsWith(
                                                                                        question.answer,
                                                                                    );
                                                                                return (
                                                                                    <div
                                                                                        key={`${question.id}-opt-${optIndex}-${option.substring(0, 10)}`}
                                                                                        className={`text-sm p-3 rounded transition-colors ${
                                                                                            isCorrect
                                                                                                ? "bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100 font-medium border border-green-200 dark:border-green-800"
                                                                                                : "bg-muted/50"
                                                                                        }`}
                                                                                    >
                                                                                        {
                                                                                            option
                                                                                        }
                                                                                    </div>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </div>

                                                                    {/* Explanation */}
                                                                    {question.explanation && (
                                                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                                                            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">
                                                                                Explanation:
                                                                            </p>
                                                                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                                                                {
                                                                                    question.explanation
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
