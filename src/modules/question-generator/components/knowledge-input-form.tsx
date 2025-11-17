"use client";

import { useTransition } from "react";
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
import { generateQuestionSet } from "../actions/generate-question-set.action";
import type { QuestionGenerationResult } from "../models/question-generator.model";

const formSchema = z.object({
    knowledgePoint: z
        .string()
        .min(2, "请输入至少2个字符")
        .max(200, "知识点过长"),
});

type FormValues = z.infer<typeof formSchema>;

interface KnowledgeInputFormProps {
    onGenerated: (result: QuestionGenerationResult) => void;
}

export function KnowledgeInputForm({ onGenerated }: KnowledgeInputFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            knowledgePoint: "",
        },
    });

    const onSubmit = (data: FormValues) => {
        startTransition(async () => {
            try {
                const result = await generateQuestionSet({
                    knowledgePoint: data.knowledgePoint,
                });

                if (result.success && result.data) {
                    toast.success(
                        `成功生成 ${result.data.totalGenerated} 道题目！`,
                    );
                    onGenerated(result.data);
                } else {
                    toast.error(result.error || "生成失败，请重试");
                }
            } catch (error) {
                console.error("Generation error:", error);
                toast.error("生成过程中出现错误");
            }
        });
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-8 shadow-lg">
            {/* Decorative background elements */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-secondary/5 blur-3xl" />

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="relative space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="knowledgePoint"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-semibold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    输入知识点
                                </FormLabel>
                                <FormDescription className="text-base">
                                    例如：中国近代史、牛顿定律、编程语言发展史
                                </FormDescription>
                                <FormControl>
                                    <Input
                                        placeholder="请输入想要学习的知识点..."
                                        {...field}
                                        disabled={isPending}
                                        className="h-14 text-lg border-2 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={isPending}
                        size="lg"
                        className="h-14 w-full text-base font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                AI 正在分析并生成题目...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                开始生成游戏题目
                            </>
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
