"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CheckCircle,
    Loader2,
    Star,
    Eye,
    Copy,
    ChevronDown,
    Target,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { getPromptsByType } from "@/modules/prompts/actions/get-prompts.action";
import { ensureDefaultPrompts } from "@/modules/prompts/actions/ensure-default-prompts.action";
import type {
    PromptWithVariables,
    TemplateVariable,
} from "@/modules/prompts/models/prompt.model";
import { createSessionAndGenerateOutline } from "@/modules/knowledge/actions/create-session.action";
import { generateQuestionsForSession } from "@/modules/knowledge/actions/generate-questions.action";
import { getAllAiModels } from "@/modules/ai-model/actions/seed-models.action";
import type { AiModel } from "@/modules/ai-model/schemas/ai-model.schema";
import { RippleWaveLoader } from "@/components/ui/pulsating-loader";

type GenerationStatus = "idle" | "outline" | "quiz" | "completed";

export default function NewKnowledgePage() {
    const router = useRouter();

    // Initial loading state
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Form state
    const [question, setQuestion] = useState("");
    const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-4o");
    const [temperature, setTemperature] = useState([0.7]);
    const [maxTokens, setMaxTokens] = useState([2000]);
    const [topP, setTopP] = useState([1.0]);

    // AI Models state
    const [aiModels, setAiModels] = useState<AiModel[]>([]);

    // Template state
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
    const [outlineVariables, setOutlineVariables] = useState<
        Record<string, string | number | boolean>
    >({});
    const [outlinePrompt, setOutlinePrompt] = useState("");
    const [quizPrompt, setQuizPrompt] = useState("");

    // UI state
    const [useTemplate, setUseTemplate] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<{
        step: GenerationStatus;
        message: string;
        progress?: number;
    } | null>(null);

    // Load templates and models on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsInitialLoading(true);

                // Load AI models
                const modelsResult = await getAllAiModels();
                if (modelsResult.success && modelsResult.data) {
                    const activeModels = modelsResult.data.filter(
                        (m) => m.isActive,
                    );
                    setAiModels(activeModels);

                    // Set default model if available
                    if (activeModels.length > 0) {
                        setSelectedModel(
                            `${activeModels[0].provider}/${activeModels[0].modelId}`,
                        );
                    }
                }

                // Ensure default templates exist for the current user
                await ensureDefaultPrompts();

                // Fetch templates
                const outlineResult = await getPromptsByType("outline");
                const quizResult = await getPromptsByType("quiz");

                // If still no templates, show error
                if (
                    !outlineResult.success ||
                    !outlineResult.data ||
                    outlineResult.data.length === 0 ||
                    !quizResult.success ||
                    !quizResult.data ||
                    quizResult.data.length === 0
                ) {
                    toast.error("加载模板失败，请刷新页面重试");
                    setIsInitialLoading(false);
                    return;
                }

                // Set outline templates
                if (outlineResult.success && outlineResult.data) {
                    setOutlineTemplates(outlineResult.data);
                    const defaultTemplate = outlineResult.data.find(
                        (t) => t.isDefault,
                    );
                    if (defaultTemplate) {
                        setSelectedOutlineTemplate(defaultTemplate.id);
                        setOutlinePrompt(defaultTemplate.content);
                        // Initialize variable default values
                        if (defaultTemplate.variables) {
                            const defaultVars: Record<
                                string,
                                string | number | boolean
                            > = {};
                            defaultTemplate.variables.forEach((v) => {
                                if (v.defaultValue !== undefined) {
                                    const varKey = v.name.replace(/[{}]/g, "");
                                    defaultVars[varKey] = v.defaultValue;
                                }
                            });
                            setOutlineVariables(defaultVars);
                        }
                    }
                }

                // Set quiz templates
                if (quizResult.success && quizResult.data) {
                    setQuizTemplates(quizResult.data);
                    const defaultTemplate = quizResult.data.find(
                        (t) => t.isDefault,
                    );
                    if (defaultTemplate) {
                        setSelectedQuizTemplate(defaultTemplate.id);
                        setQuizPrompt(defaultTemplate.content);
                    }
                }
            } catch (error) {
                console.error("Failed to load data:", error);
                toast.error("加载数据失败");
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle outline template change
    const handleOutlineTemplateChange = (templateId: string) => {
        setSelectedOutlineTemplate(templateId);
        const template = outlineTemplates.find((t) => t.id === templateId);
        if (template) {
            setOutlinePrompt(template.content);
            // Reset variables
            if (template.variables) {
                const defaultVars: Record<string, string | number | boolean> =
                    {};
                template.variables.forEach((v) => {
                    if (v.defaultValue !== undefined) {
                        const varKey = v.name.replace(/[{}]/g, "");
                        defaultVars[varKey] = v.defaultValue;
                    }
                });
                setOutlineVariables(defaultVars);
            }
        }
    };

    // Handle quiz template change
    const handleQuizTemplateChange = (templateId: string) => {
        setSelectedQuizTemplate(templateId);
        const template = quizTemplates.find((t) => t.id === templateId);
        if (template) {
            setQuizPrompt(template.content);
        }
    };

    // Render variable input
    const renderVariableInput = (
        variable: TemplateVariable,
        value: string | number | boolean,
        onChange: (val: string | number | boolean) => void,
    ) => {
        switch (variable.type) {
            case "text":
                return (
                    <Input
                        value={String(value || "")}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={variable.placeholder}
                    />
                );
            case "select":
                return (
                    <Select
                        value={String(value || variable.defaultValue)}
                        onValueChange={onChange}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {variable.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "number":
                return (
                    <Input
                        type="number"
                        value={Number(value || variable.defaultValue || 0)}
                        onChange={(e) =>
                            onChange(Number.parseInt(e.target.value, 10) || 0)
                        }
                        min={variable.min}
                        max={variable.max}
                    />
                );
            default:
                return null;
        }
    };

    // Process prompt with variables
    const processPromptWithVariables = (
        prompt: string,
        variables: Record<string, string | number | boolean>,
    ) => {
        let processedPrompt = prompt;
        for (const [key, value] of Object.entries(variables)) {
            const pattern = new RegExp(`{{${key}}}`, "g");
            processedPrompt = processedPrompt.replace(pattern, String(value));
        }
        // Replace topic variable
        processedPrompt = processedPrompt.replace(/{{topic}}/g, question);
        return processedPrompt;
    };

    // Handle generation
    const handleGenerate = async () => {
        if (!question || !selectedModel) return;

        // Validation
        if (useTemplate && !selectedOutlineTemplate) {
            toast.error("请选择大纲生成模板");
            return;
        }
        if (!useTemplate && !outlinePrompt) {
            toast.error("请输入大纲生成Prompt");
            return;
        }

        setIsGenerating(true);
        setGenerationProgress({
            step: "outline",
            message: "正在生成学习大纲...",
            progress: 10,
        });

        try {
            // Process outline prompt
            const finalOutlinePrompt = useTemplate
                ? processPromptWithVariables(outlinePrompt, outlineVariables)
                : outlinePrompt.replace(/{{topic}}/g, question);

            // Step 1: Generate outline
            const outlineResult = await createSessionAndGenerateOutline({
                title: question,
                model: selectedModel as
                    | "openai/gpt-4o"
                    | "anthropic/claude-sonnet-4"
                    | "google/gemini-2.0-flash-exp",
                outlinePrompt: finalOutlinePrompt,
                quizPrompt: quizPrompt || undefined,
            });

            if (!outlineResult.success || !outlineResult.sessionId) {
                throw new Error(
                    outlineResult.error || "Failed to generate outline",
                );
            }

            const sessionId = outlineResult.sessionId;

            setGenerationProgress({
                step: "quiz",
                message: "大纲生成完成，正在为所有章节生成题目...",
                progress: 50,
            });

            // Step 2: Generate questions for all outlines
            const quizResult = await generateQuestionsForSession(sessionId);

            if (!quizResult.success) {
                console.warn("Quiz generation failed");
                toast.error("大纲生成成功，但题目生成失败");
                router.push(`/dashboard/knowledge`);
                return;
            }

            setGenerationProgress({
                step: "completed",
                message: "生成完成！",
                progress: 100,
            });

            toast.success("知识内容生成成功！");

            // Redirect after a delay
            setTimeout(() => {
                router.push(`/dashboard/knowledge`);
            }, 1500);
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error(
                error instanceof Error ? error.message : "生成失败，请稍后重试",
            );
            setGenerationProgress(null);
        } finally {
            setIsGenerating(false);
        }
    };

    // Show loading screen while initializing
    if (isInitialLoading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">创建新知识</CardTitle>
                        <CardDescription>
                            输入主题，选择模板和模型，AI
                            将自动生成学习大纲和相关题目
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center justify-center py-16 space-y-6">
                            <RippleWaveLoader />
                            <div className="text-center space-y-2">
                                <p className="text-lg font-medium text-muted-foreground">
                                    正在加载模板和模型...
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    请稍候片刻
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
            {/* Header - More elegant spacing */}
            <div className="border-b bg-background/80 backdrop-blur-sm px-8 py-5 shrink-0 shadow-sm">
                <div className="max-w-[1400px] mx-auto">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        创建新知识
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                        通过 AI
                        自动生成结构化的学习大纲和配套练习题，让知识学习更系统、更高效
                    </p>
                </div>
            </div>

            {/* Main Content - Optimized two-column layout */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8 px-8 py-8">
                    {/* Left Column - Main Form with better spacing */}
                    <div className="overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {/* Step 1: Topic Input - Refined design */}
                        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <CardHeader className="pb-4 space-y-3">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-base font-semibold shadow-sm">
                                        1
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <CardTitle className="text-xl font-semibold tracking-tight">
                                            输入主题
                                        </CardTitle>
                                        <CardDescription className="text-sm leading-relaxed">
                                            清晰描述您想要学习的知识领域或具体问题
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Textarea
                                    id="question"
                                    placeholder="例如：深入学习操作系统的进程调度算法，包括FCFS、SJF、优先级调度等..."
                                    value={question}
                                    onChange={(e) =>
                                        setQuestion(e.target.value)
                                    }
                                    className="min-h-[120px] resize-none text-base leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/20 border-border/60"
                                />
                                {question && (
                                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        已输入 {question.length} 个字符
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Step 2: Template Configuration - Enhanced design */}
                        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <CardHeader className="pb-4 space-y-3">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-base font-semibold shadow-sm">
                                        2
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-semibold tracking-tight">
                                                配置 Prompt
                                            </CardTitle>
                                            <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/40">
                                                <Label
                                                    htmlFor="template-mode"
                                                    className="text-sm font-medium cursor-pointer"
                                                >
                                                    {useTemplate
                                                        ? "模板模式"
                                                        : "直接输入"}
                                                </Label>
                                                <Switch
                                                    id="template-mode"
                                                    checked={useTemplate}
                                                    onCheckedChange={
                                                        setUseTemplate
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <CardDescription className="text-sm leading-relaxed">
                                            {useTemplate
                                                ? "使用预设模板，快速配置生成参数"
                                                : "完全自定义 Prompt 内容，灵活控制"}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                                {useTemplate ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Outline Template */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                                大纲模板
                                            </Label>
                                            <Select
                                                value={selectedOutlineTemplate}
                                                onValueChange={
                                                    handleOutlineTemplateChange
                                                }
                                            >
                                                <SelectTrigger className="h-10 border-border/60 hover:border-primary/40 transition-colors">
                                                    <SelectValue placeholder="选择大纲生成模板" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {outlineTemplates.map(
                                                        (template) => (
                                                            <SelectItem
                                                                key={
                                                                    template.id
                                                                }
                                                                value={
                                                                    template.id
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span>
                                                                        {
                                                                            template.name
                                                                        }
                                                                    </span>
                                                                    {template.isDefault && (
                                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Quiz Template */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">
                                                题目模板
                                            </Label>
                                            <Select
                                                value={selectedQuizTemplate}
                                                onValueChange={
                                                    handleQuizTemplateChange
                                                }
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="选择" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {quizTemplates.map(
                                                        (template) => (
                                                            <SelectItem
                                                                key={
                                                                    template.id
                                                                }
                                                                value={
                                                                    template.id
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span>
                                                                        {
                                                                            template.name
                                                                        }
                                                                    </span>
                                                                    {template.isDefault && (
                                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Direct Outline Prompt Input */}
                                            <div className="space-y-2">
                                                <Label htmlFor="direct-outline-prompt">
                                                    大纲生成 Prompt
                                                </Label>
                                                <Textarea
                                                    id="direct-outline-prompt"
                                                    placeholder="输入用于生成学习大纲的完整Prompt..."
                                                    value={outlinePrompt}
                                                    onChange={(e) =>
                                                        setOutlinePrompt(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="min-h-[120px] font-mono text-sm"
                                                />
                                            </div>

                                            {/* Direct Quiz Prompt Input */}
                                            <div className="space-y-2">
                                                <Label htmlFor="direct-quiz-prompt">
                                                    题目生成 Prompt
                                                </Label>
                                                <Textarea
                                                    id="direct-quiz-prompt"
                                                    placeholder="输入用于生成题目的完整Prompt..."
                                                    value={quizPrompt}
                                                    onChange={(e) =>
                                                        setQuizPrompt(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="min-h-[120px] font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-3">
                                            💡 直接输入模式：
                                            <ul className="mt-1 ml-4 list-disc space-y-1">
                                                <li>
                                                    大纲Prompt中可使用{" "}
                                                    <code className="bg-white px-1 rounded">
                                                        {"{{topic}}"}
                                                    </code>{" "}
                                                    来引用主题
                                                </li>
                                                <li>
                                                    题目Prompt中可使用{" "}
                                                    <code className="bg-white px-1 rounded">
                                                        {"{{chapter_title}}"}
                                                    </code>{" "}
                                                    和{" "}
                                                    <code className="bg-white px-1 rounded">
                                                        {"{{chapter_content}}"}
                                                    </code>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Real-time Prompt Preview */}
                                {question &&
                                    ((useTemplate &&
                                        (selectedOutlineTemplate ||
                                            selectedQuizTemplate)) ||
                                        (!useTemplate &&
                                            (outlinePrompt || quizPrompt))) && (
                                        <Card className="border-indigo-200 bg-indigo-50/30">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    实际发送的 Prompt 预览
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    下方显示的是将变量替换后实际发送给AI的完整prompt内容
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Tabs defaultValue="outline">
                                                    <TabsList className="grid w-full grid-cols-2">
                                                        <TabsTrigger
                                                            value="outline"
                                                            disabled={
                                                                useTemplate
                                                                    ? !selectedOutlineTemplate
                                                                    : !outlinePrompt
                                                            }
                                                        >
                                                            大纲 Prompt{" "}
                                                            {useTemplate
                                                                ? !selectedOutlineTemplate &&
                                                                  "(未选择)"
                                                                : !outlinePrompt &&
                                                                  "(未输入)"}
                                                        </TabsTrigger>
                                                        <TabsTrigger
                                                            value="quiz"
                                                            disabled={
                                                                useTemplate
                                                                    ? !selectedQuizTemplate
                                                                    : !quizPrompt
                                                            }
                                                        >
                                                            题目 Prompt{" "}
                                                            {useTemplate
                                                                ? !selectedQuizTemplate &&
                                                                  "(未选择)"
                                                                : !quizPrompt &&
                                                                  "(未输入)"}
                                                        </TabsTrigger>
                                                    </TabsList>

                                                    {((useTemplate &&
                                                        selectedOutlineTemplate) ||
                                                        (!useTemplate &&
                                                            outlinePrompt)) && (
                                                        <TabsContent
                                                            value="outline"
                                                            className="space-y-3"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        实际发送给AI的大纲生成Prompt:
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {useTemplate
                                                                            ? outlineTemplates.find(
                                                                                  (
                                                                                      t,
                                                                                  ) =>
                                                                                      t.id ===
                                                                                      selectedOutlineTemplate,
                                                                              )
                                                                                  ?.name ||
                                                                              "模板"
                                                                            : "直接输入"}
                                                                    </Badge>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2"
                                                                    onClick={() => {
                                                                        const promptToUse =
                                                                            useTemplate
                                                                                ? processPromptWithVariables(
                                                                                      outlinePrompt,
                                                                                      outlineVariables,
                                                                                  )
                                                                                : outlinePrompt.replace(
                                                                                      /{{topic}}/g,
                                                                                      question,
                                                                                  );
                                                                        navigator.clipboard.writeText(
                                                                            promptToUse,
                                                                        );
                                                                        toast.success(
                                                                            "大纲Prompt已复制",
                                                                        );
                                                                    }}
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="bg-background rounded p-3 border text-xs font-mono max-h-32 overflow-y-auto">
                                                                {useTemplate
                                                                    ? processPromptWithVariables(
                                                                          outlinePrompt,
                                                                          outlineVariables,
                                                                      )
                                                                    : outlinePrompt.replace(
                                                                          /{{topic}}/g,
                                                                          question,
                                                                      )}
                                                            </div>

                                                            {/* Variable Configuration - Only in template mode */}
                                                            {(() => {
                                                                if (
                                                                    !useTemplate ||
                                                                    !outlineTemplates ||
                                                                    outlineTemplates.length ===
                                                                        0
                                                                )
                                                                    return false;
                                                                const template =
                                                                    outlineTemplates.find(
                                                                        (t) =>
                                                                            t.id ===
                                                                            selectedOutlineTemplate,
                                                                    );
                                                                const vars =
                                                                    template?.variables?.filter(
                                                                        (v) =>
                                                                            v.name &&
                                                                            v.name !==
                                                                                "{{topic}}",
                                                                    );
                                                                return (
                                                                    vars &&
                                                                    vars.length >
                                                                        0
                                                                );
                                                            })() && (
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs text-muted-foreground">
                                                                        参数配置:
                                                                    </Label>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {outlineTemplates
                                                                            .find(
                                                                                (
                                                                                    t,
                                                                                ) =>
                                                                                    t.id ===
                                                                                    selectedOutlineTemplate,
                                                                            )
                                                                            ?.variables?.filter(
                                                                                (
                                                                                    v,
                                                                                ) =>
                                                                                    v.name &&
                                                                                    v.name !==
                                                                                        "{{topic}}",
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    variable,
                                                                                ) => {
                                                                                    const varKey =
                                                                                        variable.name
                                                                                            ? variable.name.replace(
                                                                                                  /[{}]/g,
                                                                                                  "",
                                                                                              )
                                                                                            : "";
                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                variable.name ||
                                                                                                varKey
                                                                                            }
                                                                                            className="space-y-1"
                                                                                        >
                                                                                            <Label className="text-xs">
                                                                                                {
                                                                                                    variable.displayName
                                                                                                }
                                                                                            </Label>
                                                                                            {renderVariableInput(
                                                                                                variable,
                                                                                                outlineVariables[
                                                                                                    varKey
                                                                                                ],
                                                                                                (
                                                                                                    val,
                                                                                                ) =>
                                                                                                    setOutlineVariables(
                                                                                                        {
                                                                                                            ...outlineVariables,
                                                                                                            [varKey]:
                                                                                                                val,
                                                                                                        },
                                                                                                    ),
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                },
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TabsContent>
                                                    )}

                                                    {((useTemplate &&
                                                        selectedQuizTemplate) ||
                                                        (!useTemplate &&
                                                            quizPrompt)) && (
                                                        <TabsContent
                                                            value="quiz"
                                                            className="space-y-3"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        题目生成Prompt模板:
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {useTemplate
                                                                            ? quizTemplates.find(
                                                                                  (
                                                                                      t,
                                                                                  ) =>
                                                                                      t.id ===
                                                                                      selectedQuizTemplate,
                                                                              )
                                                                                  ?.name ||
                                                                              "模板"
                                                                            : "直接输入"}
                                                                    </Badge>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(
                                                                            quizPrompt,
                                                                        );
                                                                        toast.success(
                                                                            "题目Prompt已复制",
                                                                        );
                                                                    }}
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="bg-background rounded p-3 border text-xs font-mono max-h-32 overflow-y-auto">
                                                                {quizPrompt}
                                                            </div>
                                                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                                                                <div className="flex items-start gap-2">
                                                                    <Target className="w-3 h-3 mt-0.5 text-amber-600" />
                                                                    <div>
                                                                        <div className="font-medium mb-1">
                                                                            动态变量替换说明：
                                                                        </div>
                                                                        <div>
                                                                            •{" "}
                                                                            <code className="bg-amber-100 px-1 rounded">
                                                                                {
                                                                                    "{{chapter_title}}"
                                                                                }
                                                                            </code>{" "}
                                                                            -
                                                                            每个章节的标题会自动注入
                                                                        </div>
                                                                        <div>
                                                                            •{" "}
                                                                            <code className="bg-amber-100 px-1 rounded">
                                                                                {
                                                                                    "{{chapter_content}}"
                                                                                }
                                                                            </code>{" "}
                                                                            -
                                                                            每个章节的详细内容会自动注入
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TabsContent>
                                                    )}
                                                </Tabs>
                                            </CardContent>
                                        </Card>
                                    )}
                            </CardContent>
                        </Card>

                        {/* Mobile: Model Selection (Hidden on Desktop) */}
                        <Card className="lg:hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                        3
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">
                                            选择模型
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            AI 模型和参数设置
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">AI 模型</Label>
                                    <Select
                                        value={selectedModel}
                                        onValueChange={(value) =>
                                            setSelectedModel(value)
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="选择" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {aiModels.map((model) => {
                                                const modelValue = `${model.provider}/${model.modelId}`;
                                                return (
                                                    <SelectItem
                                                        key={model.id}
                                                        value={modelValue}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                {
                                                                    model.displayName
                                                                }
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px]"
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

                                {/* Mobile Advanced Parameters */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-8 text-xs"
                                    onClick={() =>
                                        setShowAdvanced(!showAdvanced)
                                    }
                                >
                                    <span>高级参数</span>
                                    <div
                                        className={cn(
                                            "transition-transform",
                                            showAdvanced && "rotate-180",
                                        )}
                                    >
                                        <ChevronDown className="h-3 w-3" />
                                    </div>
                                </Button>

                                {showAdvanced && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2">
                                        {/* Temperature */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs">
                                                    Temperature
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {temperature[0]}
                                                </span>
                                            </div>
                                            <Slider
                                                value={temperature}
                                                onValueChange={setTemperature}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                            />
                                        </div>

                                        {/* Max Tokens */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs">
                                                    Max Tokens
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {maxTokens[0]}
                                                </span>
                                            </div>
                                            <Slider
                                                value={maxTokens}
                                                onValueChange={setMaxTokens}
                                                min={100}
                                                max={4000}
                                                step={100}
                                            />
                                        </div>

                                        {/* Top P */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs">
                                                    Top P
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {topP[0]}
                                                </span>
                                            </div>
                                            <Slider
                                                value={topP}
                                                onValueChange={setTopP}
                                                min={0}
                                                max={1}
                                                step={0.1}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Progress Display (Mobile only) */}
                        {generationProgress && (
                            <Card className="lg:hidden border-primary/50">
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            {generationProgress.step ===
                                            "completed" ? (
                                                <CheckCircle className="size-4 text-green-500" />
                                            ) : (
                                                <Loader2 className="size-4 animate-spin text-primary" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {generationProgress.message}
                                            </span>
                                        </div>
                                        {generationProgress.progress !==
                                            undefined && (
                                            <Progress
                                                value={
                                                    generationProgress.progress
                                                }
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Sticky Settings Sidebar */}
                    <div className="hidden lg:block space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {/* Model Selection Card - Elegant design */}
                        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 sticky top-0">
                            <CardHeader className="pb-4 space-y-3">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-base font-semibold shadow-sm">
                                        3
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <CardTitle className="text-xl font-semibold tracking-tight">
                                            AI 模型
                                        </CardTitle>
                                        <CardDescription className="text-sm leading-relaxed">
                                            选择合适的模型和参数
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                                        模型选择
                                    </Label>
                                    <Select
                                        value={selectedModel}
                                        onValueChange={(value) =>
                                            setSelectedModel(value)
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="选择" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {aiModels.map((model) => {
                                                const modelValue = `${model.provider}/${model.modelId}`;
                                                return (
                                                    <SelectItem
                                                        key={model.id}
                                                        value={modelValue}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">
                                                                    {
                                                                        model.displayName
                                                                    }
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px] h-4 px-1"
                                                                >
                                                                    {
                                                                        model.provider
                                                                    }
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                <span>
                                                                    入: $
                                                                    {model.inputPricePerMillion.toFixed(
                                                                        2,
                                                                    )}
                                                                    /1M
                                                                </span>
                                                                <span>
                                                                    出: $
                                                                    {model.outputPricePerMillion.toFixed(
                                                                        2,
                                                                    )}
                                                                    /1M
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Advanced Parameters Toggle */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-8 text-xs"
                                    onClick={() =>
                                        setShowAdvanced(!showAdvanced)
                                    }
                                >
                                    <span>高级参数</span>
                                    <div
                                        className={cn(
                                            "transition-transform",
                                            showAdvanced && "rotate-180",
                                        )}
                                    >
                                        <ChevronDown className="h-3 w-3" />
                                    </div>
                                </Button>

                                {showAdvanced && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2">
                                        {/* Temperature */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs">
                                                    Temperature
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {temperature[0]}
                                                </span>
                                            </div>
                                            <Slider
                                                value={temperature}
                                                onValueChange={setTemperature}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                            />
                                        </div>

                                        {/* Max Tokens */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs">
                                                    Max Tokens
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {maxTokens[0]}
                                                </span>
                                            </div>
                                            <Slider
                                                value={maxTokens}
                                                onValueChange={setMaxTokens}
                                                min={100}
                                                max={4000}
                                                step={100}
                                            />
                                        </div>

                                        {/* Top P */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs">
                                                    Top P
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {topP[0]}
                                                </span>
                                            </div>
                                            <Slider
                                                value={topP}
                                                onValueChange={setTopP}
                                                min={0}
                                                max={1}
                                                step={0.1}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Progress Display */}
                        {generationProgress && (
                            <Card className="border-primary/50">
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            {generationProgress.step ===
                                            "completed" ? (
                                                <CheckCircle className="size-4 text-green-500" />
                                            ) : (
                                                <Loader2 className="size-4 animate-spin text-primary" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {generationProgress.message}
                                            </span>
                                        </div>
                                        {generationProgress.progress !==
                                            undefined && (
                                            <Progress
                                                value={
                                                    generationProgress.progress
                                                }
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar - Premium design */}
            <div className="border-t bg-background/95 backdrop-blur-md px-8 py-4 shrink-0 shadow-lg">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6">
                    {/* Status indicator */}
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                !question || !selectedModel
                                    ? "bg-amber-400 animate-pulse"
                                    : "bg-green-500",
                            )}
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {!question
                                    ? "等待输入主题"
                                    : !selectedModel
                                      ? "请选择 AI 模型"
                                      : "所有配置就绪"}
                            </span>
                            {question && selectedModel && (
                                <span className="text-xs text-muted-foreground">
                                    点击右侧按钮开始生成
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={
                            !question ||
                            !selectedModel ||
                            isGenerating ||
                            (useTemplate
                                ? !selectedOutlineTemplate
                                : !outlinePrompt)
                        }
                        size="lg"
                        className="min-w-[220px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-2.5">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>AI 生成中...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <span>开始生成</span>
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
