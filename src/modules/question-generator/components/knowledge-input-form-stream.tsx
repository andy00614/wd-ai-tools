"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type {
    QuestionGenerationResult,
    PipelineLog,
} from "../models/question-generator.model";

const formSchema = z.object({
    knowledgePoint: z
        .string()
        .min(2, "请输入至少2个字符")
        .max(200, "知识点过长"),
});

type FormValues = z.infer<typeof formSchema>;

interface KnowledgeInputFormStreamProps {
    onGenerated: (result: QuestionGenerationResult) => void;
    onLogUpdate: (logs: PipelineLog[]) => void;
    onStreamingChange: (isStreaming: boolean) => void;
}

export function KnowledgeInputFormStream({
    onGenerated,
    onLogUpdate,
    onStreamingChange,
}: KnowledgeInputFormStreamProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            knowledgePoint: "",
        },
    });

    const onSubmit = async (data: FormValues) => {
        setIsPending(true);
        onStreamingChange(true);

        const logs: PipelineLog[] = [];

        try {
            const response = await fetch(
                "/api/questions-game/generate-stream",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        knowledgePoint: data.knowledgePoint,
                    }),
                },
            );

            if (!response.ok) {
                throw new Error("Stream request failed");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No reader available");
            }

            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                // Process complete messages
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || ""; // Keep incomplete message in buffer

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const jsonStr = line.slice(6);
                        try {
                            const log: PipelineLog = JSON.parse(jsonStr);
                            logs.push(log);
                            onLogUpdate([...logs]);

                            // Check if this is the final result
                            if (
                                log.step === "完成" &&
                                log.status === "success" &&
                                log.details?.result
                            ) {
                                onGenerated(log.details.result);
                                toast.success(
                                    `成功生成 ${log.details.result.totalGenerated} 道题目！`,
                                );
                            }

                            // Handle errors
                            if (log.status === "error") {
                                toast.error(log.error || "生成过程中出现错误");
                            }
                        } catch (e) {
                            console.error("Failed to parse log:", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Generation error:", error);
            toast.error("生成过程中出现错误");
        } finally {
            setIsPending(false);
            onStreamingChange(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-3"
                >
                    <FormField
                        control={form.control}
                        name="knowledgePoint"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    输入知识点
                                </FormLabel>
                                <FormDescription className="text-xs">
                                    例如：中国近代史、牛顿定律、编程语言发展史
                                </FormDescription>
                                <FormControl>
                                    <Input
                                        placeholder="请输入想要学习的知识点..."
                                        {...field}
                                        disabled={isPending}
                                        className="h-10 text-sm"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={isPending}
                        size="sm"
                        className="h-9 w-full text-sm font-semibold"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                AI 正在分析生成...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-1.5 h-4 w-4" />
                                开始生成
                            </>
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
