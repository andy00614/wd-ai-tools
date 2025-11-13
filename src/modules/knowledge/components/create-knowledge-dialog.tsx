"use client";

import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AiModel } from "@/modules/ai-model/schemas/ai-model.schema";
import { ensureDefaultPrompts } from "@/modules/prompts/actions/ensure-default-prompts.action";
import { getPromptsByType } from "@/modules/prompts/actions/get-prompts.action";
import type { PromptWithVariables } from "@/modules/prompts/models/prompt.model";
import { createSessionAndGenerateOutline } from "../actions/create-session.action";
import { generateQuestionsForSession } from "../actions/generate-questions.action";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    aiModels: AiModel[];
};

export default function CreateKnowledgeDialog({
    open,
    onOpenChange,
    aiModels,
}: Props) {
    const router = useRouter();
    const [question, setQuestion] = useState("");
    const [selectedModel, setSelectedModel] = useState<string>(
        aiModels.length > 0
            ? `${aiModels[0].provider}/${aiModels[0].modelId}`
            : "",
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    // Quick create configuration
    const [numOutlines, setNumOutlines] = useState(5);
    const [numQuestionsPerOutline, setNumQuestionsPerOutline] = useState(5);

    // Prompt template state
    const [outlineTemplates, setOutlineTemplates] = useState<
        PromptWithVariables[]
    >([]);
    const [selectedOutlineTemplate, setSelectedOutlineTemplate] =
        useState<string>("");
    const [outlinePrompt, setOutlinePrompt] = useState("");
    const [customOutlinePrompt, setCustomOutlinePrompt] = useState("");

    // Load templates on mount
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                await ensureDefaultPrompts();
                const outlineResult = await getPromptsByType("outline");
                if (outlineResult.success && outlineResult.data) {
                    setOutlineTemplates(outlineResult.data);
                    // Auto-select default template
                    const defaultTemplate = outlineResult.data.find(
                        (t) => t.isDefault,
                    );
                    if (defaultTemplate) {
                        setSelectedOutlineTemplate(defaultTemplate.id);
                        setOutlinePrompt(defaultTemplate.content);
                        // Also auto-fill custom prompt for advanced tab
                        setCustomOutlinePrompt(defaultTemplate.content);
                    }
                }
            } catch (error) {
                console.error("Failed to load templates:", error);
            }
        };

        if (open) {
            loadTemplates();
        }
    }, [open]);

    const handleTemplateChange = (templateId: string) => {
        setSelectedOutlineTemplate(templateId);
        const template = outlineTemplates.find((t) => t.id === templateId);
        if (template) {
            setOutlinePrompt(template.content);
            // Auto-fill custom prompt input
            setCustomOutlinePrompt(template.content);
        }
    };

    const handleSubmit = async (useCustomPrompt = false) => {
        if (!question || !selectedModel) {
            toast.error("请填写主题并选择模型");
            return;
        }

        // Validate custom prompt if in advanced mode
        if (useCustomPrompt && !customOutlinePrompt) {
            toast.error("请输入自定义 Prompt");
            return;
        }

        setIsGenerating(true);
        setProgress(0);

        try {
            // Step 1: Generate outline (50%)
            setProgress(10);

            // Use custom prompt or default template with injected counts
            let finalPrompt = useCustomPrompt
                ? customOutlinePrompt
                : outlinePrompt;

            console.log("[CreateDialog] Before injection:");
            console.log("- useCustomPrompt:", useCustomPrompt);
            console.log("- numOutlines:", numOutlines);
            console.log("- numQuestionsPerOutline:", numQuestionsPerOutline);
            console.log("- Original prompt:", finalPrompt);

            // In quick mode, inject counts into the prompt
            if (!useCustomPrompt) {
                const beforeReplace = finalPrompt;

                // Strategy 1: Replace "Create X-Y main topics" pattern
                finalPrompt = finalPrompt.replace(
                    /Create\s+(\d+)[-–](\d+)\s+main\s+topics?/gi,
                    `Create ${numOutlines} main topics`,
                );

                console.log("[CreateDialog] After first replace:");
                console.log(
                    "- Matched 'Create X-Y main topics' pattern:",
                    beforeReplace !== finalPrompt,
                );
                console.log("- Updated prompt:", finalPrompt);

                // Strategy 2: If not found, try general number-range pattern
                if (beforeReplace === finalPrompt) {
                    finalPrompt = finalPrompt.replace(
                        /(\d+)[-–](\d+)\s*(main\s*topics?|章节|outlines?)/gi,
                        `${numOutlines} $3`,
                    );
                    console.log(
                        "[CreateDialog] After second replace:",
                        beforeReplace !== finalPrompt,
                    );
                }

                // Strategy 3: If still no match, inject at Requirements section
                if (!finalPrompt.includes(String(numOutlines))) {
                    console.log(
                        "[CreateDialog] No numOutlines found, trying to inject...",
                    );
                    const beforeInject = finalPrompt;

                    // Try to replace Requirements section
                    finalPrompt = finalPrompt.replace(
                        /(Requirements?:\s*\n)/i,
                        `$1- Generate exactly ${numOutlines} main topics/outlines\n- For each topic, generate ${numQuestionsPerOutline} practice questions\n`,
                    );

                    console.log(
                        "[CreateDialog] Injection result:",
                        beforeInject !== finalPrompt,
                    );
                    console.log("[CreateDialog] Final prompt:", finalPrompt);
                }
            }

            console.log("[CreateDialog] Sending to API:");
            console.log("- Final prompt:", finalPrompt);

            const outlineResult = await createSessionAndGenerateOutline({
                title: question,
                model: selectedModel,
                outlinePrompt: finalPrompt,
            });

            if (!outlineResult.success || !outlineResult.sessionId) {
                toast.error(outlineResult.error || "生成大纲失败");
                setIsGenerating(false);
                return;
            }

            setProgress(50);

            // Step 2: Generate questions (50-100%)
            const quizResult = await generateQuestionsForSession(
                outlineResult.sessionId,
            );

            if (!quizResult.success) {
                toast.error(quizResult.error || "生成题目失败");
                setIsGenerating(false);
                return;
            }

            setProgress(100);
            toast.success("知识内容生成成功！");

            // Close dialog and refresh
            setTimeout(() => {
                onOpenChange(false);
                setQuestion("");
                setIsGenerating(false);
                setProgress(0);
                router.refresh();
            }, 500);
        } catch (error) {
            console.error("Generation error:", error);
            toast.error("生成过程中发生错误");
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        创建新知识
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="quick" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="quick">快速创建</TabsTrigger>
                        <TabsTrigger value="advanced">高级配置</TabsTrigger>
                    </TabsList>

                    {/* Quick Create Tab */}
                    <TabsContent value="quick" className="space-y-6 mt-6">
                        {/* Topic Input */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="topic"
                                className="text-base font-medium"
                            >
                                学习主题
                            </Label>
                            <Textarea
                                id="topic"
                                placeholder="例如：深入学习操作系统的进程调度算法..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="min-h-[120px] resize-none text-base"
                                disabled={isGenerating}
                            />
                            {question && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    已输入 {question.length} 个字符
                                </p>
                            )}
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="model"
                                className="text-base font-medium"
                            >
                                AI 模型
                            </Label>
                            <Select
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                                disabled={isGenerating}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="选择 AI 模型" />
                                </SelectTrigger>
                                <SelectContent>
                                    {aiModels.map((model) => {
                                        const modelValue = `${model.provider}/${model.modelId}`;
                                        return (
                                            <SelectItem
                                                key={model.id}
                                                value={modelValue}
                                            >
                                                <div className="flex items-center gap-3 py-1">
                                                    <span className="font-medium">
                                                        {model.displayName}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {model.provider}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Generation Configuration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="num-outlines"
                                    className="text-sm font-medium"
                                >
                                    大纲章节数量
                                </Label>
                                <Input
                                    id="num-outlines"
                                    type="number"
                                    min={3}
                                    max={10}
                                    value={numOutlines}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                        setNumOutlines(
                                            Number.parseInt(
                                                e.target.value,
                                                10,
                                            ) || 5,
                                        )
                                    }
                                    disabled={isGenerating}
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    推荐 3-10 个章节
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="num-questions"
                                    className="text-sm font-medium"
                                >
                                    每章节题目数量
                                </Label>
                                <Input
                                    id="num-questions"
                                    type="number"
                                    min={3}
                                    max={10}
                                    value={numQuestionsPerOutline}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                        setNumQuestionsPerOutline(
                                            Number.parseInt(
                                                e.target.value,
                                                10,
                                            ) || 5,
                                        )
                                    }
                                    disabled={isGenerating}
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    推荐 3-10 道题目
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        {isGenerating && (
                            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="size-5 animate-spin text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {progress < 50
                                                ? "正在生成学习大纲..."
                                                : "正在生成练习题目..."}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {progress}% 完成
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-colors",
                                        !question || !selectedModel
                                            ? "bg-amber-400 animate-pulse"
                                            : "bg-green-500",
                                    )}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {!question
                                        ? "请输入主题"
                                        : !selectedModel
                                          ? "请选择模型"
                                          : "准备就绪"}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isGenerating}
                                >
                                    取消
                                </Button>
                                <Button
                                    onClick={() => handleSubmit(false)}
                                    disabled={
                                        !question ||
                                        !selectedModel ||
                                        isGenerating
                                    }
                                    className="min-w-[120px]"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            生成中...
                                        </div>
                                    ) : (
                                        "开始生成"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Advanced Config Tab */}
                    <TabsContent value="advanced" className="space-y-6 mt-6">
                        {/* Topic Input */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="topic-advanced"
                                className="text-base font-medium"
                            >
                                学习主题
                            </Label>
                            <Textarea
                                id="topic-advanced"
                                placeholder="例如：深入学习操作系统的进程调度算法..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="min-h-[100px] resize-none text-base"
                                disabled={isGenerating}
                            />
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="model-advanced"
                                className="text-base font-medium"
                            >
                                AI 模型
                            </Label>
                            <Select
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                                disabled={isGenerating}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="选择 AI 模型" />
                                </SelectTrigger>
                                <SelectContent>
                                    {aiModels.map((model) => {
                                        const modelValue = `${model.provider}/${model.modelId}`;
                                        return (
                                            <SelectItem
                                                key={model.id}
                                                value={modelValue}
                                            >
                                                <div className="flex items-center gap-3 py-1">
                                                    <span className="font-medium">
                                                        {model.displayName}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {model.provider}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Prompt Template Selection */}
                        <div className="space-y-2">
                            <Label className="text-base font-medium">
                                Prompt 模板（可选）
                            </Label>
                            <Select
                                value={selectedOutlineTemplate}
                                onValueChange={handleTemplateChange}
                                disabled={isGenerating}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="选择模板或直接在下方输入自定义 Prompt" />
                                </SelectTrigger>
                                <SelectContent>
                                    {outlineTemplates.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            暂无可用模板
                                        </SelectItem>
                                    ) : (
                                        outlineTemplates.map((template) => (
                                            <SelectItem
                                                key={template.id}
                                                value={template.id}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{template.name}</span>
                                                    {template.isDefault && (
                                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {selectedOutlineTemplate ? (
                                <p className="text-xs text-muted-foreground">
                                    已选择{" "}
                                    <span className="font-medium">
                                        {
                                            outlineTemplates.find(
                                                (t) =>
                                                    t.id ===
                                                    selectedOutlineTemplate,
                                            )?.name
                                        }
                                    </span>
                                    。您可以在下方查看和编辑模板内容
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    可选择预设模板自动填充,或直接在下方输入自定义
                                    Prompt
                                </p>
                            )}
                        </div>

                        {/* Custom Prompt Input */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="custom-prompt"
                                className="text-base font-medium"
                            >
                                自定义 Prompt
                            </Label>
                            <Textarea
                                id="custom-prompt"
                                placeholder="输入自定义的 Prompt，或使用上方选择的模板..."
                                value={customOutlinePrompt}
                                onChange={(e) =>
                                    setCustomOutlinePrompt(e.target.value)
                                }
                                className="min-h-[200px] resize-none font-mono text-sm"
                                disabled={isGenerating}
                            />
                            <p className="text-xs text-muted-foreground">
                                提示：使用 {"{"}
                                {"{"} topic {"}"}
                                {"}"} 占位符来引用主题
                            </p>
                        </div>

                        {/* Progress */}
                        {isGenerating && (
                            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="size-5 animate-spin text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {progress < 50
                                                ? "正在生成学习大纲..."
                                                : "正在生成练习题目..."}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {progress}% 完成
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-colors",
                                        !question ||
                                            !selectedModel ||
                                            !customOutlinePrompt
                                            ? "bg-amber-400 animate-pulse"
                                            : "bg-green-500",
                                    )}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {!question
                                        ? "请输入主题"
                                        : !selectedModel
                                          ? "请选择模型"
                                          : !customOutlinePrompt
                                            ? "请输入自定义 Prompt"
                                            : "准备就绪"}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isGenerating}
                                >
                                    取消
                                </Button>
                                <Button
                                    onClick={() => handleSubmit(true)}
                                    disabled={
                                        !question ||
                                        !selectedModel ||
                                        !customOutlinePrompt ||
                                        isGenerating
                                    }
                                    className="min-w-[120px]"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            生成中...
                                        </div>
                                    ) : (
                                        "开始生成"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
