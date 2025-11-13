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
                    {/* Step 1: Topic Input */}
                    <div className="space-y-2">
                        <Label htmlFor="question">输入您的问题或主题</Label>
                        <Textarea
                            id="question"
                            placeholder="例如：请帮我生成关于操作系统的知识点和题目..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>

                    {/* Step 2: Template Configuration */}
                    <div className="space-y-4">
                        {/* Template/Direct Input Toggle */}
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center space-x-3">
                                <div className="flex flex-col">
                                    <Label className="text-sm font-medium">
                                        Prompt 输入方式
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {useTemplate
                                            ? "使用预设模板，支持变量配置"
                                            : "直接输入完整的Prompt内容"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label
                                    htmlFor="template-mode"
                                    className="text-sm"
                                >
                                    {useTemplate ? "模板模式" : "直接输入"}
                                </Label>
                                <Switch
                                    id="template-mode"
                                    checked={useTemplate}
                                    onCheckedChange={setUseTemplate}
                                />
                            </div>
                        </div>

                        {useTemplate ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Outline Template Selector */}
                                <div className="space-y-2">
                                    <Label>大纲生成模板</Label>
                                    <Select
                                        value={selectedOutlineTemplate}
                                        onValueChange={
                                            handleOutlineTemplateChange
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择大纲模板" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {outlineTemplates.map(
                                                (template) => (
                                                    <SelectItem
                                                        key={template.id}
                                                        value={template.id}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                {template.name}
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

                                {/* Quiz Template Selector */}
                                <div className="space-y-2">
                                    <Label>题目生成模板</Label>
                                    <Select
                                        value={selectedQuizTemplate}
                                        onValueChange={handleQuizTemplateChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择题目模板" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {quizTemplates.map((template) => (
                                                <SelectItem
                                                    key={template.id}
                                                    value={template.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {template.name}
                                                        </span>
                                                        {template.isDefault && (
                                                            <Star className="w-3 h-3 text-yellow-500" />
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
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
                                                setOutlinePrompt(e.target.value)
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
                                                setQuizPrompt(e.target.value)
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
                                                                          (t) =>
                                                                              t.id ===
                                                                              selectedOutlineTemplate,
                                                                      )?.name ||
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
                                                            vars.length > 0
                                                        );
                                                    })() && (
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-muted-foreground">
                                                                参数配置:
                                                            </Label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {outlineTemplates
                                                                    .find(
                                                                        (t) =>
                                                                            t.id ===
                                                                            selectedOutlineTemplate,
                                                                    )
                                                                    ?.variables?.filter(
                                                                        (v) =>
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
                                                                          (t) =>
                                                                              t.id ===
                                                                              selectedQuizTemplate,
                                                                      )?.name ||
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
                    </div>

                    {/* Step 3: Model and Parameters */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="model">AI 模型</Label>
                                <Select
                                    value={selectedModel}
                                    onValueChange={(value) =>
                                        setSelectedModel(value)
                                    }
                                >
                                    <SelectTrigger className="min-h-[104px]">
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
                                                    <div className="flex flex-col gap-1 py-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {
                                                                    model.displayName
                                                                }
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs capitalize"
                                                            >
                                                                {model.provider}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span>
                                                                输入: $
                                                                {model.inputPricePerMillion.toFixed(
                                                                    2,
                                                                )}
                                                                /1M
                                                            </span>
                                                            <span>
                                                                输出: $
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

                            <div className="space-y-2">
                                <Label>模型参数</Label>
                                <Card
                                    className={cn(
                                        "transition-all duration-300 min-h-[104px]",
                                        showAdvanced &&
                                            "ring-2 ring-primary/20",
                                    )}
                                >
                                    <CardContent className="p-4 h-full flex flex-col justify-center">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between h-auto p-0 text-left hover:bg-transparent"
                                            onClick={() =>
                                                setShowAdvanced(!showAdvanced)
                                            }
                                        >
                                            <div className="flex flex-col items-start gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        参数设置
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs font-mono"
                                                    >
                                                        T: {temperature[0]}
                                                    </Badge>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs font-mono"
                                                    >
                                                        M: {maxTokens[0]}
                                                    </Badge>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs font-mono"
                                                    >
                                                        P: {topP[0]}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div
                                                className={cn(
                                                    "transition-transform duration-200",
                                                    showAdvanced &&
                                                        "rotate-180",
                                                )}
                                            >
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Advanced Parameters - Collapsible */}
                        {showAdvanced && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <Card className="border-dashed bg-muted/30">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-foreground">
                                                        Temperature
                                                    </Label>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {temperature[0]}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    <Slider
                                                        value={temperature}
                                                        onValueChange={
                                                            setTemperature
                                                        }
                                                        min={0}
                                                        max={2}
                                                        step={0.1}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>精确 (0)</span>
                                                        <span>创意 (2)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-foreground">
                                                        Max Tokens
                                                    </Label>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {maxTokens[0]}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    <Slider
                                                        value={maxTokens}
                                                        onValueChange={
                                                            setMaxTokens
                                                        }
                                                        min={100}
                                                        max={4000}
                                                        step={100}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>短 (100)</span>
                                                        <span>长 (4K)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-foreground">
                                                        Top P
                                                    </Label>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {topP[0]}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    <Slider
                                                        value={topP}
                                                        onValueChange={setTopP}
                                                        min={0}
                                                        max={1}
                                                        step={0.1}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>保守 (0)</span>
                                                        <span>多样 (1)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Progress Display */}
                    {generationProgress && (
                        <Card className="mb-4">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        {generationProgress.step ===
                                        "completed" ? (
                                            <CheckCircle className="size-5 text-green-500" />
                                        ) : (
                                            <Loader2 className="size-5 animate-spin text-primary" />
                                        )}
                                        <span className="text-sm font-medium">
                                            {generationProgress.message}
                                        </span>
                                    </div>

                                    {generationProgress.progress !==
                                        undefined && (
                                        <div className="space-y-2">
                                            <Progress
                                                value={
                                                    generationProgress.progress
                                                }
                                                className="w-full"
                                            />
                                            <div className="text-xs text-muted-foreground text-right">
                                                {generationProgress.progress}%
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-sm text-muted-foreground">
                                        {generationProgress.step ===
                                            "outline" &&
                                            "📚 正在分析您的主题并创建详细的学习大纲..."}
                                        {generationProgress.step === "quiz" &&
                                            "📝 正在为每个章节生成练习题目，这可能需要几分钟时间..."}
                                        {generationProgress.step ===
                                            "completed" &&
                                            "✅ 所有内容都已生成完成，即将跳转到列表页面！"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                        className="w-full"
                        size="lg"
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                生成中...
                            </div>
                        ) : (
                            "生成知识内容和题目"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
