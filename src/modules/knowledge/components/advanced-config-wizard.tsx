"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PromptWithVariables } from "@/modules/prompts/models/prompt.model";

// 运行时变量列表（在实际生成时由系统自动填充）
const RUNTIME_VARIABLES = ["chapter_title", "chapter_content"];

// 检查是否为运行时变量
function isRuntimeVariable(varName: string): boolean {
    return RUNTIME_VARIABLES.includes(varName);
}

// 从 Prompt 内容中提取所有变量 (格式: {{variableName}})
function extractVariablesFromPrompt(promptContent: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    // biome-ignore lint: exec 在循环中使用是安全的
    while ((match = regex.exec(promptContent)) !== null) {
        variables.add(match[1]);
    }

    return Array.from(variables);
}

// 替换 Prompt 中的变量为实际值
function replaceVariablesInPrompt(
    promptContent: string,
    variableValues: Record<string, string | number>,
): string {
    let result = promptContent;

    for (const [key, value] of Object.entries(variableValues)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        result = result.replace(regex, String(value));
    }

    return result;
}

type WizardProps = {
    // Step 1 data
    question: string;
    setQuestion: (value: string) => void;
    numOutlines: number;
    setNumOutlines: (value: number) => void;
    numQuestionsPerOutline: number;
    setNumQuestionsPerOutline: (value: number) => void;

    // Step 2 data (outline)
    useDefaultOutlinePrompt: boolean;
    setUseDefaultOutlinePrompt: (value: boolean) => void;
    outlineTemplates: PromptWithVariables[];
    selectedOutlineTemplate: string;
    onOutlineTemplateChange: (id: string) => void;
    customOutlinePrompt: string;
    setCustomOutlinePrompt: (value: string) => void;

    // Step 3 data (quiz)
    useDefaultQuizPrompt: boolean;
    setUseDefaultQuizPrompt: (value: boolean) => void;
    quizTemplates: PromptWithVariables[];
    selectedQuizTemplate: string;
    onQuizTemplateChange: (id: string) => void;
    customQuizPrompt: string;
    setCustomQuizPrompt: (value: string) => void;

    // Control
    currentStep: number;
    onStepChange: (step: number) => void;
    onComplete: () => void;
    isGenerating: boolean;
};

export function AdvancedConfigWizard({
    question,
    setQuestion,
    numOutlines,
    setNumOutlines,
    numQuestionsPerOutline,
    setNumQuestionsPerOutline,
    useDefaultOutlinePrompt,
    setUseDefaultOutlinePrompt,
    outlineTemplates,
    selectedOutlineTemplate,
    onOutlineTemplateChange,
    customOutlinePrompt,
    setCustomOutlinePrompt,
    useDefaultQuizPrompt,
    setUseDefaultQuizPrompt,
    quizTemplates,
    selectedQuizTemplate,
    onQuizTemplateChange,
    customQuizPrompt,
    setCustomQuizPrompt,
    currentStep,
    onStepChange,
    onComplete,
    isGenerating,
}: WizardProps) {
    // Dynamic variable management for Step 2 (Outline)
    const [outlineVariableValues, setOutlineVariableValues] = useState<
        Record<string, string | number>
    >({});

    // Dynamic variable management for Step 3 (Quiz)
    const [quizVariableValues, setQuizVariableValues] = useState<
        Record<string, string | number>
    >({});

    // Extract variables from Outline prompt
    const outlineVariables = useMemo(() => {
        return extractVariablesFromPrompt(customOutlinePrompt);
    }, [customOutlinePrompt]);

    // Extract variables from Quiz prompt
    const quizVariables = useMemo(() => {
        return extractVariablesFromPrompt(customQuizPrompt);
    }, [customQuizPrompt]);

    // Initialize/sync outline variable values when variables change
    useEffect(() => {
        setOutlineVariableValues((prev) => {
            const newValues: Record<string, string | number> = { ...prev };

            for (const varName of outlineVariables) {
                // Only set if not already set
                if (!(varName in newValues)) {
                    // Provide smart defaults based on variable name
                    if (varName === "topic") {
                        newValues[varName] = question;
                    } else if (varName === "numOutlines") {
                        newValues[varName] = numOutlines;
                    } else {
                        newValues[varName] = "";
                    }
                }
            }

            // Remove variables that are no longer in the prompt
            for (const key of Object.keys(newValues)) {
                if (!outlineVariables.includes(key)) {
                    delete newValues[key];
                }
            }

            return newValues;
        });
    }, [outlineVariables, question, numOutlines]);

    // Initialize/sync quiz variable values when variables change
    useEffect(() => {
        setQuizVariableValues((prev) => {
            const newValues: Record<string, string | number> = { ...prev };

            for (const varName of quizVariables) {
                if (!(varName in newValues)) {
                    // Provide smart defaults
                    if (varName === "outlineTitle") {
                        newValues[varName] = "章节标题示例";
                    } else if (varName === "numQuestions") {
                        newValues[varName] = numQuestionsPerOutline;
                    } else {
                        newValues[varName] = "";
                    }
                }
            }

            // Remove variables no longer in prompt
            for (const key of Object.keys(newValues)) {
                if (!quizVariables.includes(key)) {
                    delete newValues[key];
                }
            }

            return newValues;
        });
    }, [quizVariables, numQuestionsPerOutline]);

    // Step 1: Basic Configuration
    const renderStep1 = () => (
        <div className="space-y-6">
            {/* Topic */}
            <div className="space-y-2">
                <Label htmlFor="wizard-topic" className="text-base font-medium">
                    学习主题 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="wizard-topic"
                    placeholder="例如：深入学习 React Hooks 的使用..."
                    value={question}
                    onChange={(e) => {
                        setQuestion(e.target.value);
                        // Auto-sync to outline variables if 'topic' exists
                        if (outlineVariables.includes("topic")) {
                            setOutlineVariableValues((prev) => ({
                                ...prev,
                                topic: e.target.value,
                            }));
                        }
                    }}
                    className="min-h-[100px] resize-none"
                    disabled={isGenerating}
                />
                {question && (
                    <p className="text-xs text-muted-foreground">
                        ✓ 已输入 {question.length} 个字符
                    </p>
                )}
            </div>

            {/* Generation Counts */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label
                        htmlFor="wizard-outlines"
                        className="text-sm font-medium"
                    >
                        大纲章节数量 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="wizard-outlines"
                        type="number"
                        min={3}
                        max={10}
                        value={numOutlines}
                        onChange={(e) => {
                            const value =
                                Number.parseInt(e.target.value, 10) || 5;
                            setNumOutlines(value);
                            // Auto-sync to outline variables if 'numOutlines' exists
                            if (outlineVariables.includes("numOutlines")) {
                                setOutlineVariableValues((prev) => ({
                                    ...prev,
                                    numOutlines: value,
                                }));
                            }
                        }}
                        className="h-11"
                        disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                        范围：3-10 个章节
                    </p>
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="wizard-questions"
                        className="text-sm font-medium"
                    >
                        每章节题目数量{" "}
                        <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="wizard-questions"
                        type="number"
                        min={3}
                        max={10}
                        value={numQuestionsPerOutline}
                        onChange={(e) => {
                            const value =
                                Number.parseInt(e.target.value, 10) || 5;
                            setNumQuestionsPerOutline(value);
                            // Auto-sync to quiz variables if 'numQuestions' exists
                            if (quizVariables.includes("numQuestions")) {
                                setQuizVariableValues((prev) => ({
                                    ...prev,
                                    numQuestions: value,
                                }));
                            }
                        }}
                        className="h-11"
                        disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                        范围：3-10 道题目
                    </p>
                </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm font-medium mb-2">📊 配置预览</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                        • 将生成 <strong>{numOutlines}</strong> 个大纲章节
                    </li>
                    <li>
                        • 每个章节包含 <strong>{numQuestionsPerOutline}</strong>{" "}
                        道练习题
                    </li>
                    <li>
                        • 总计约{" "}
                        <strong>{numOutlines * numQuestionsPerOutline}</strong>{" "}
                        道题目
                    </li>
                </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4 border-t">
                <Button
                    onClick={() => onStepChange(2)}
                    disabled={!question || isGenerating}
                    className="min-w-[140px]"
                >
                    下一步：配置大纲 Prompt
                    <ArrowRight className="ml-2 size-4" />
                </Button>
            </div>
        </div>
    );

    // Step 2: Outline Prompt Configuration
    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Prompt Mode Selection */}
            <div className="space-y-3">
                <Label className="text-base font-medium">选择生成方式</Label>
                <div className="grid gap-3">
                    <button
                        type="button"
                        onClick={() => setUseDefaultOutlinePrompt(true)}
                        className={cn(
                            "p-4 border-2 rounded-lg text-left transition-all",
                            useDefaultOutlinePrompt
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                        )}
                        disabled={isGenerating}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    useDefaultOutlinePrompt
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground",
                                )}
                            >
                                {useDefaultOutlinePrompt && (
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">
                                    使用默认模板（推荐）
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    系统会自动生成适合的大纲结构
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setUseDefaultOutlinePrompt(false)}
                        className={cn(
                            "p-4 border-2 rounded-lg text-left transition-all",
                            !useDefaultOutlinePrompt
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                        )}
                        disabled={isGenerating}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    !useDefaultOutlinePrompt
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground",
                                )}
                            >
                                {!useDefaultOutlinePrompt && (
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">自定义 Prompt</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    完全控制大纲的生成方式和结构
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Custom Prompt Editor */}
            {!useDefaultOutlinePrompt && (
                <div className="space-y-4">
                    {/* Template Selection */}
                    {outlineTemplates.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                从模板开始（可选）
                            </Label>
                            <Select
                                value={selectedOutlineTemplate}
                                onValueChange={onOutlineTemplateChange}
                                disabled={isGenerating}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择一个模板..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {outlineTemplates.map((template) => (
                                        <SelectItem
                                            key={template.id}
                                            value={template.id}
                                        >
                                            {template.name}
                                            {template.isDefault && " ⭐"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Variable Configuration */}
                    {outlineVariables.length > 0 && (
                        <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                            <p className="text-sm font-medium">📝 配置变量值</p>
                            <div className="space-y-3">
                                {outlineVariables.map((varName) => (
                                    <div key={varName} className="space-y-2">
                                        <Label
                                            htmlFor={`outline-var-${varName}`}
                                            className="text-xs font-medium"
                                        >
                                            {varName}
                                        </Label>
                                        <Input
                                            id={`outline-var-${varName}`}
                                            type={
                                                varName
                                                    .toLowerCase()
                                                    .includes("num")
                                                    ? "number"
                                                    : "text"
                                            }
                                            value={
                                                outlineVariableValues[
                                                    varName
                                                ] ?? ""
                                            }
                                            onChange={(e) => {
                                                const value = varName
                                                    .toLowerCase()
                                                    .includes("num")
                                                    ? Number.parseInt(
                                                          e.target.value,
                                                          10,
                                                      ) || 0
                                                    : e.target.value;
                                                setOutlineVariableValues(
                                                    (prev) => ({
                                                        ...prev,
                                                        [varName]: value,
                                                    }),
                                                );
                                            }}
                                            placeholder={`输入 ${varName} 的值...`}
                                            disabled={isGenerating}
                                            min={
                                                varName
                                                    .toLowerCase()
                                                    .includes("num")
                                                    ? 1
                                                    : undefined
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            在 Prompt 中使用{" "}
                                            <code className="bg-muted px-1 rounded">
                                                {`{{${varName}}}`}
                                            </code>{" "}
                                            引用此值
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Prompt Editor */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="outline-prompt"
                            className="text-sm font-medium"
                        >
                            Prompt 内容
                        </Label>
                        <Textarea
                            id="outline-prompt"
                            value={customOutlinePrompt}
                            onChange={(e) =>
                                setCustomOutlinePrompt(e.target.value)
                            }
                            placeholder="输入自定义的大纲生成 Prompt...&#10;&#10;示例：&#10;Generate {{numOutlines}} outlines about {{topic}}"
                            className="min-h-[200px] font-mono text-sm"
                            disabled={isGenerating}
                        />
                        <p className="text-xs text-muted-foreground">
                            💡 提示：在 Prompt 中使用{" "}
                            <code className="bg-muted px-1 rounded">
                                {"{{variableName}}"}
                            </code>{" "}
                            格式定义变量
                            {outlineVariables.length > 0 && (
                                <span>
                                    ，当前检测到:{" "}
                                    {outlineVariables
                                        .map((v) => `{{${v}}}`)
                                        .join(", ")}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={() => onStepChange(1)}
                    disabled={isGenerating}
                >
                    <ArrowLeft className="mr-2 size-4" />
                    上一步
                </Button>
                <Button
                    onClick={() => onStepChange(3)}
                    disabled={!useDefaultOutlinePrompt && !customOutlinePrompt}
                >
                    下一步：配置题目 Prompt
                    <ArrowRight className="ml-2 size-4" />
                </Button>
            </div>
        </div>
    );

    // Step 3: Quiz Prompt Configuration
    const renderStep3 = () => (
        <div className="space-y-6">
            {/* Prompt Mode Selection */}
            <div className="space-y-3">
                <Label className="text-base font-medium">选择生成方式</Label>
                <div className="grid gap-3">
                    <button
                        type="button"
                        onClick={() => setUseDefaultQuizPrompt(true)}
                        className={cn(
                            "p-4 border-2 rounded-lg text-left transition-all",
                            useDefaultQuizPrompt
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                        )}
                        disabled={isGenerating}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    useDefaultQuizPrompt
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground",
                                )}
                            >
                                {useDefaultQuizPrompt && (
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">
                                    使用默认模板（推荐）
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    系统会自动生成标准的选择题
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setUseDefaultQuizPrompt(false)}
                        className={cn(
                            "p-4 border-2 rounded-lg text-left transition-all",
                            !useDefaultQuizPrompt
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                        )}
                        disabled={isGenerating}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    !useDefaultQuizPrompt
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground",
                                )}
                            >
                                {!useDefaultQuizPrompt && (
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">自定义 Prompt</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    自定义题目类型、难度和风格
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Custom Prompt Editor */}
            {!useDefaultQuizPrompt && (
                <div className="space-y-4">
                    {/* Template Selection */}
                    {quizTemplates.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                从模板开始（可选）
                            </Label>
                            <Select
                                value={selectedQuizTemplate}
                                onValueChange={onQuizTemplateChange}
                                disabled={isGenerating}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择一个模板..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {quizTemplates.map((template) => (
                                        <SelectItem
                                            key={template.id}
                                            value={template.id}
                                        >
                                            {template.name}
                                            {template.isDefault && " ⭐"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Variable Configuration */}
                    {quizVariables.length > 0 && (
                        <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                            <p className="text-sm font-medium">📝 配置变量值</p>
                            <div className="space-y-3">
                                {quizVariables.map((varName) => {
                                    const isRuntime =
                                        isRuntimeVariable(varName);
                                    return (
                                        <div
                                            key={varName}
                                            className="space-y-2"
                                        >
                                            <Label
                                                htmlFor={`quiz-var-${varName}`}
                                                className="text-xs font-medium flex items-center gap-2"
                                            >
                                                {varName}
                                                {isRuntime && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                        运行时
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                id={`quiz-var-${varName}`}
                                                type={
                                                    varName
                                                        .toLowerCase()
                                                        .includes("num")
                                                        ? "number"
                                                        : "text"
                                                }
                                                value={
                                                    isRuntime
                                                        ? "[生成时自动填充]"
                                                        : (quizVariableValues[
                                                              varName
                                                          ] ?? "")
                                                }
                                                onChange={(e) => {
                                                    if (isRuntime) return;
                                                    const value = varName
                                                        .toLowerCase()
                                                        .includes("num")
                                                        ? Number.parseInt(
                                                              e.target.value,
                                                              10,
                                                          ) || 0
                                                        : e.target.value;
                                                    setQuizVariableValues(
                                                        (prev) => ({
                                                            ...prev,
                                                            [varName]: value,
                                                        }),
                                                    );
                                                }}
                                                placeholder={
                                                    isRuntime
                                                        ? "系统自动填充"
                                                        : `输入 ${varName} 的值...`
                                                }
                                                disabled={
                                                    isGenerating || isRuntime
                                                }
                                                className={
                                                    isRuntime
                                                        ? "bg-muted/50 cursor-not-allowed text-muted-foreground"
                                                        : ""
                                                }
                                                min={
                                                    varName
                                                        .toLowerCase()
                                                        .includes("num")
                                                        ? 1
                                                        : undefined
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {isRuntime ? (
                                                    <>
                                                        💡{" "}
                                                        <strong>
                                                            {varName}
                                                        </strong>{" "}
                                                        是运行时变量，
                                                        {varName ===
                                                            "chapter_title" &&
                                                            "生成题目时会自动替换为实际的章节标题"}
                                                        {varName ===
                                                            "chapter_content" &&
                                                            "生成题目时会自动替换为实际的章节内容"}
                                                    </>
                                                ) : (
                                                    <>
                                                        在 Prompt 中使用{" "}
                                                        <code className="bg-muted px-1 rounded">
                                                            {`{{${varName}}}`}
                                                        </code>{" "}
                                                        引用此值
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Prompt Editor */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="quiz-prompt"
                            className="text-sm font-medium"
                        >
                            Prompt 内容
                        </Label>
                        <Textarea
                            id="quiz-prompt"
                            value={customQuizPrompt}
                            onChange={(e) =>
                                setCustomQuizPrompt(e.target.value)
                            }
                            placeholder="输入自定义的题目生成 Prompt...&#10;&#10;示例：&#10;Generate {{numQuestions}} quiz questions about {{outlineTitle}}"
                            className="min-h-[200px] font-mono text-sm"
                            disabled={isGenerating}
                        />
                        <p className="text-xs text-muted-foreground">
                            💡 提示：在 Prompt 中使用{" "}
                            <code className="bg-muted px-1 rounded">
                                {"{{variableName}}"}
                            </code>{" "}
                            格式定义变量
                            {quizVariables.length > 0 && (
                                <span>
                                    ，当前检测到:{" "}
                                    {quizVariables
                                        .map((v) => `{{${v}}}`)
                                        .join(", ")}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={() => onStepChange(2)}
                    disabled={isGenerating}
                >
                    <ArrowLeft className="mr-2 size-4" />
                    上一步
                </Button>
                <Button
                    onClick={() => onStepChange(4)}
                    disabled={!useDefaultQuizPrompt && !customQuizPrompt.trim()}
                >
                    下一步：配置总览
                    <ArrowRight className="ml-2 size-4" />
                </Button>
            </div>
        </div>
    );

    // Step 4: Configuration Summary
    const renderStep4 = () => (
        <div className="space-y-6">
            {/* Configuration Summary */}
            <div className="space-y-4">
                {/* Basic Configuration */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                            1
                        </span>
                        基础配置
                    </h4>
                    <div className="space-y-2 text-sm ml-8">
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">
                                学习主题:
                            </span>
                            <span className="font-medium">{question}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">
                                大纲数量:
                            </span>
                            <span className="font-medium">
                                {numOutlines} 个
                            </span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">
                                每章节题目:
                            </span>
                            <span className="font-medium">
                                {numQuestionsPerOutline} 道
                            </span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">
                                预计总题目:
                            </span>
                            <span className="font-medium">
                                {numOutlines * numQuestionsPerOutline} 道
                            </span>
                        </div>
                    </div>
                </div>

                {/* Outline Prompt Configuration */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                            2
                        </span>
                        大纲生成 Prompt
                    </h4>
                    <div className="space-y-2 text-sm ml-8">
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">
                                生成方式:
                            </span>
                            <span className="font-medium">
                                {useDefaultOutlinePrompt
                                    ? "使用默认模板"
                                    : "自定义 Prompt"}
                            </span>
                        </div>
                        {!useDefaultOutlinePrompt && (
                            <>
                                {/* Display all variable values */}
                                {Object.entries(outlineVariableValues).map(
                                    ([key, value]) => (
                                        <div
                                            key={key}
                                            className="grid grid-cols-[120px_1fr] gap-2"
                                        >
                                            <span className="text-muted-foreground">
                                                变量 - {key}:
                                            </span>
                                            <span className="font-medium">
                                                {String(value)}
                                            </span>
                                        </div>
                                    ),
                                )}
                                <div className="col-span-2">
                                    <p className="text-muted-foreground mb-1">
                                        Prompt 内容（已替换变量）:
                                    </p>
                                    <div className="bg-background p-3 rounded border font-mono text-xs break-words whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                                        {replaceVariablesInPrompt(
                                            customOutlinePrompt,
                                            outlineVariableValues,
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Quiz Prompt Configuration */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                            3
                        </span>
                        题目生成 Prompt
                    </h4>
                    <div className="space-y-2 text-sm ml-8">
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">
                                生成方式:
                            </span>
                            <span className="font-medium">
                                {useDefaultQuizPrompt
                                    ? "使用默认模板"
                                    : "自定义 Prompt"}
                            </span>
                        </div>
                        {!useDefaultQuizPrompt && (
                            <>
                                {/* Display all variable values */}
                                {quizVariables.map((varName) => {
                                    const isRuntime =
                                        isRuntimeVariable(varName);
                                    const value = quizVariableValues[varName];
                                    return (
                                        <div
                                            key={varName}
                                            className="grid grid-cols-[120px_1fr] gap-2"
                                        >
                                            <span className="text-muted-foreground">
                                                变量 - {varName}:
                                            </span>
                                            <span className="font-medium flex items-center gap-2">
                                                {isRuntime ? (
                                                    <>
                                                        [运行时填充]
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                            运行时
                                                        </span>
                                                    </>
                                                ) : (
                                                    String(value ?? "")
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div className="col-span-2">
                                    <p className="text-muted-foreground mb-1">
                                        Prompt 内容预览:
                                    </p>
                                    <div className="bg-background p-3 rounded border font-mono text-xs break-words whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                                        {replaceVariablesInPrompt(
                                            customQuizPrompt,
                                            {
                                                ...quizVariableValues,
                                                // 运行时变量显示占位符
                                                chapter_title: "[章节标题]",
                                                chapter_content: "[章节内容]",
                                            },
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        💡 运行时变量将在实际生成时自动替换
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm">
                    ✅{" "}
                    <strong>
                        确认配置无误后，点击"开始生成"将创建学习内容
                    </strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    • 生成过程可能需要几分钟时间
                    <br />• 生成开始后请勿关闭页面
                </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={() => onStepChange(3)}
                    disabled={isGenerating}
                >
                    <ArrowLeft className="mr-2 size-4" />
                    上一步
                </Button>
                <Button
                    onClick={onComplete}
                    disabled={isGenerating}
                    className="min-w-[120px]"
                >
                    <Check className="mr-2 size-4" />
                    开始生成
                </Button>
            </div>
        </div>
    );

    // Render based on current step
    return (
        <div className="relative">
            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center flex-1">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all",
                                    step === currentStep
                                        ? "bg-primary text-primary-foreground"
                                        : step < currentStep
                                          ? "bg-primary/20 text-primary"
                                          : "bg-muted text-muted-foreground",
                                )}
                            >
                                {step < currentStep ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    step
                                )}
                            </div>
                            {step < 4 && (
                                <div
                                    className={cn(
                                        "h-0.5 flex-1 mx-2",
                                        step < currentStep
                                            ? "bg-primary"
                                            : "bg-muted",
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>基础配置</span>
                    <span>大纲 Prompt</span>
                    <span>题目 Prompt</span>
                    <span>配置总览</span>
                </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
        </div>
    );
}
