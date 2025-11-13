"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createSessionAndGenerateOutline } from "../actions/create-session.action";
import { generateQuestionsForSession } from "../actions/generate-questions.action";
import type { CreateSessionInput } from "../models/knowledge.model";

type GenerationStatus =
    | "idle"
    | "generating_outline"
    | "outline_generated"
    | "generating_questions"
    | "completed"
    | "failed";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionInput: CreateSessionInput;
};

type OutlineItem = {
    title: string;
};

export default function GenerationDialog({
    open,
    onOpenChange,
    sessionInput,
}: Props) {
    const router = useRouter();
    const [status, setStatus] = useState<GenerationStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [outlines, setOutlines] = useState<OutlineItem[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            // Reset state when dialog closes
            setStatus("idle");
            setError(null);
            setOutlines([]);
            setSessionId(null);
            return;
        }

        // Start generation process - only generate outline
        async function generateOutline() {
            try {
                // Step 1: Generate outline
                setStatus("generating_outline");
                const outlineResult =
                    await createSessionAndGenerateOutline(sessionInput);

                if (!outlineResult.success) {
                    throw new Error(
                        outlineResult.error || "Failed to generate outline",
                    );
                }

                if (!outlineResult.sessionId) {
                    throw new Error("Session ID not returned");
                }

                // Save outlines and session ID
                setOutlines(
                    outlineResult.outlines?.map((o) => ({ title: o.title })) ||
                        [],
                );
                setSessionId(outlineResult.sessionId);
                setStatus("outline_generated");
            } catch (err) {
                console.error("Outline generation failed:", err);
                setStatus("failed");
                setError(
                    err instanceof Error ? err.message : "Generation failed",
                );
                toast.error("Failed to generate outline");
            }
        }

        generateOutline();
    }, [open, sessionInput]);

    // Function to continue generating questions
    async function continueToQuestions() {
        if (!sessionId) return;

        try {
            setStatus("generating_questions");
            const questionsResult =
                await generateQuestionsForSession(sessionId);

            if (!questionsResult.success) {
                throw new Error(
                    questionsResult.error || "Failed to generate questions",
                );
            }

            // Completed
            setStatus("completed");
            toast.success("Knowledge session generated successfully!");

            // Close dialog and refresh after 2 seconds
            setTimeout(() => {
                onOpenChange(false);
                router.refresh();
            }, 2000);
        } catch (err) {
            console.error("Question generation failed:", err);
            setStatus("failed");
            setError(
                err instanceof Error
                    ? err.message
                    : "Question generation failed",
            );
            toast.error("Failed to generate questions");
        }
    }

    const statusConfig = {
        idle: {
            icon: null,
            title: "Starting...",
            description: "Preparing to generate knowledge session",
        },
        generating_outline: {
            icon: <Loader2 className="size-6 animate-spin text-primary" />,
            title: "Generating Outline",
            description: "AI is creating the knowledge structure...",
        },
        outline_generated: {
            icon: <BookOpen className="size-6 text-primary" />,
            title: "Outline Generated!",
            description:
                "Review the topics below and continue to generate questions",
        },
        generating_questions: {
            icon: <Loader2 className="size-6 animate-spin text-primary" />,
            title: "Generating Questions",
            description: "Creating quiz questions for each topic...",
        },
        completed: {
            icon: <CheckCircle2 className="size-6 text-green-600" />,
            title: "Generation Complete!",
            description: "Your knowledge session is ready",
        },
        failed: {
            icon: <XCircle className="size-6 text-destructive" />,
            title: "Generation Failed",
            description: error || "Something went wrong",
        },
    };

    const config = statusConfig[status];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Creating Knowledge Session</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-6">
                    {config.icon}
                    <div className="text-center">
                        <h3 className="font-semibold text-lg">
                            {config.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            {config.description}
                        </p>
                    </div>

                    {status === "outline_generated" && outlines.length > 0 && (
                        <div className="w-full mt-4">
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <h4 className="font-medium text-sm mb-3">
                                    Generated Topics:
                                </h4>
                                {outlines.map((outline, index) => (
                                    <div
                                        key={`outline-${index}-${outline.title}`}
                                        className="flex items-start gap-3 text-sm"
                                    >
                                        <span className="text-muted-foreground font-medium min-w-[24px]">
                                            {index + 1}.
                                        </span>
                                        <span className="flex-1">
                                            {outline.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={continueToQuestions}
                                className="w-full mt-4"
                                size="lg"
                            >
                                Continue to Generate Questions
                            </Button>
                        </div>
                    )}

                    {status === "failed" && (
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="outline"
                            className="mt-2"
                        >
                            Close
                        </Button>
                    )}

                    {status === "completed" && (
                        <p className="text-xs text-muted-foreground">
                            Refreshing page...
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
