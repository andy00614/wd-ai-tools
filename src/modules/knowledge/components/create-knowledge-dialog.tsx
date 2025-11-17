"use client";

import { Loader2 } from "lucide-react";
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
import { AdvancedConfigWizard } from "./advanced-config-wizard";

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

    // Wizard state for advanced mode
    const [wizardStep, setWizardStep] = useState(1); // 1=基础配置, 2=大纲Prompt, 3=题目Prompt
    const [useDefaultOutlinePrompt, setUseDefaultOutlinePrompt] =
        useState(true);
    const [useDefaultQuizPrompt, setUseDefaultQuizPrompt] = useState(true);

    // Prompt template state
    const [outlineTemplates, setOutlineTemplates] = useState<
        PromptWithVariables[]
    >([]);
    const [quizTemplates, setQuizTemplates] = useState<PromptWithVariables[]>(
        [],
    );
    const [selectedOutlineTemplate, setSelectedOutlineTemplate] =
        useState<string>("");
    const [selectedQuizTemplate, setSelectedQuizTemplate] =
        useState<string>("");
    const [_outlinePrompt, setOutlinePrompt] = useState("");
    const [customOutlinePrompt, setCustomOutlinePrompt] = useState("");
    const [customQuizPrompt, setCustomQuizPrompt] = useState("");

    // Load templates on mount
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                await ensureDefaultPrompts();

                // Load outline templates
                const outlineResult = await getPromptsByType("outline");
                if (outlineResult.success && outlineResult.data) {
                    setOutlineTemplates(outlineResult.data);
                    const defaultTemplate = outlineResult.data.find(
                        (t) => t.isDefault,
                    );
                    if (defaultTemplate) {
                        setSelectedOutlineTemplate(defaultTemplate.id);
                        setOutlinePrompt(defaultTemplate.content);
                        setCustomOutlinePrompt(defaultTemplate.content);
                    }
                }

                // Load quiz templates
                const quizResult = await getPromptsByType("quiz");
                if (quizResult.success && quizResult.data) {
                    setQuizTemplates(quizResult.data);
                    const defaultTemplate = quizResult.data.find(
                        (t) => t.isDefault,
                    );
                    if (defaultTemplate) {
                        setSelectedQuizTemplate(defaultTemplate.id);
                        setCustomQuizPrompt(defaultTemplate.content);
                    }
                }
            } catch (error) {
                console.error("Failed to load templates:", error);
            }
        };

        if (open) {
            loadTemplates();
            // Reset wizard step when dialog opens
            setWizardStep(1);
        }
    }, [open]);

    const handleOutlineTemplateChange = (templateId: string) => {
        setSelectedOutlineTemplate(templateId);
        const template = outlineTemplates.find((t) => t.id === templateId);
        if (template) {
            setOutlinePrompt(template.content);
            setCustomOutlinePrompt(template.content);
        }
    };

    const handleQuizTemplateChange = (templateId: string) => {
        setSelectedQuizTemplate(templateId);
        const template = quizTemplates.find((t) => t.id === templateId);
        if (template) {
            setCustomQuizPrompt(template.content);
        }
    };

    // Helper function to insert variable at cursor position
    const _insertVariable = (
        variable: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        currentValue: string,
    ) => {
        setter(`${currentValue} {{${variable}}}`);
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

            // Use custom prompt if in advanced mode
            const finalPrompt = useCustomPrompt
                ? customOutlinePrompt
                : undefined;

            console.log("[CreateDialog] Creating session:");
            console.log("- title:", question);
            console.log("- model:", selectedModel);
            console.log("- numOutlines:", numOutlines);
            console.log("- questionsPerOutline:", numQuestionsPerOutline);
            console.log("- customPrompt:", finalPrompt ? "Yes" : "No");

            const outlineResult = await createSessionAndGenerateOutline({
                title: question,
                model: selectedModel,
                numOutlines: numOutlines,
                questionsPerOutline: numQuestionsPerOutline,
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

    // Handle wizard completion
    const handleWizardComplete = async () => {
        if (!question || !selectedModel) {
            toast.error("请填写主题并选择模型");
            return;
        }

        setIsGenerating(true);
        setProgress(0);

        try {
            setProgress(10);

            // Determine final prompts based on user selection
            const finalOutlinePrompt = useDefaultOutlinePrompt
                ? undefined
                : customOutlinePrompt;
            const finalQuizPrompt = useDefaultQuizPrompt
                ? undefined
                : customQuizPrompt;

            console.log("[Wizard] Creating session:");
            console.log("- title:", question);
            console.log("- model:", selectedModel);
            console.log("- numOutlines:", numOutlines);
            console.log("- questionsPerOutline:", numQuestionsPerOutline);
            console.log(
                "- outlinePrompt:",
                finalOutlinePrompt ? "Custom" : "Default",
            );
            console.log(
                "- quizPrompt:",
                finalQuizPrompt ? "Custom" : "Default",
            );

            const outlineResult = await createSessionAndGenerateOutline({
                title: question,
                model: selectedModel,
                numOutlines: numOutlines,
                questionsPerOutline: numQuestionsPerOutline,
                outlinePrompt: finalOutlinePrompt,
                quizPrompt: finalQuizPrompt,
            });

            if (!outlineResult.success || !outlineResult.sessionId) {
                toast.error(outlineResult.error || "生成大纲失败");
                setIsGenerating(false);
                return;
            }

            setProgress(50);

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

            setTimeout(() => {
                onOpenChange(false);
                setQuestion("");
                setIsGenerating(false);
                setProgress(0);
                setWizardStep(1);
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
                <DialogHeader className="sticky top-0 z-10 -mx-6 -mt-6 border-b bg-background/95 px-6 py-4 text-center backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:text-left">
                    <DialogTitle className="text-xl font-semibold leading-tight">
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
                    {/* Advanced Config Tab - Wizard Mode */}
                    <TabsContent value="advanced" className="mt-6">
                        <AdvancedConfigWizard
                            question={question}
                            setQuestion={setQuestion}
                            numOutlines={numOutlines}
                            setNumOutlines={setNumOutlines}
                            numQuestionsPerOutline={numQuestionsPerOutline}
                            setNumQuestionsPerOutline={
                                setNumQuestionsPerOutline
                            }
                            useDefaultOutlinePrompt={useDefaultOutlinePrompt}
                            setUseDefaultOutlinePrompt={
                                setUseDefaultOutlinePrompt
                            }
                            outlineTemplates={outlineTemplates}
                            selectedOutlineTemplate={selectedOutlineTemplate}
                            onOutlineTemplateChange={
                                handleOutlineTemplateChange
                            }
                            customOutlinePrompt={customOutlinePrompt}
                            setCustomOutlinePrompt={setCustomOutlinePrompt}
                            useDefaultQuizPrompt={useDefaultQuizPrompt}
                            setUseDefaultQuizPrompt={setUseDefaultQuizPrompt}
                            quizTemplates={quizTemplates}
                            selectedQuizTemplate={selectedQuizTemplate}
                            onQuizTemplateChange={handleQuizTemplateChange}
                            customQuizPrompt={customQuizPrompt}
                            setCustomQuizPrompt={setCustomQuizPrompt}
                            currentStep={wizardStep}
                            onStepChange={setWizardStep}
                            onComplete={handleWizardComplete}
                            isGenerating={isGenerating}
                        />

                        {/* Progress Indicator */}
                        {isGenerating && (
                            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border mt-6">
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
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
