"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
    // Step 2 variable values
    const [outlineVarTopic, setOutlineVarTopic] = useState(question);
    const [outlineVarNumOutlines, setOutlineVarNumOutlines] =
        useState(numOutlines);

    // Step 3 variable values
    const [quizVarOutlineTitle, setQuizVarOutlineTitle] =
        useState("章节标题示例");
    const [quizVarNumQuestions, setQuizVarNumQuestions] = useState(
        numQuestionsPerOutline,
    );

    // Sync variable values when props change
    useState(() => {
        setOutlineVarTopic(question);
        setOutlineVarNumOutlines(numOutlines);
        setQuizVarNumQuestions(numQuestionsPerOutline);
    });

    // Step 1: Basic Configuration
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">步骤 1/4: 基础配置</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    设置学习主题和生成数量
                </p>
            </div>

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
                        setOutlineVarTopic(e.target.value);
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
                            setOutlineVarNumOutlines(value);
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
                            setQuizVarNumQuestions(value);
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
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">
                    步骤 2/4: 大纲生成 Prompt
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    自定义如何生成学习大纲
                </p>
            </div>

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
                    <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                        <p className="text-sm font-medium">📝 配置变量值</p>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="var-topic"
                                    className="text-xs font-medium"
                                >
                                    topic（学习主题）
                                </Label>
                                <Input
                                    id="var-topic"
                                    value={outlineVarTopic}
                                    onChange={(e) =>
                                        setOutlineVarTopic(e.target.value)
                                    }
                                    placeholder="输入学习主题..."
                                    disabled={isGenerating}
                                />
                                <p className="text-xs text-muted-foreground">
                                    在 Prompt 中使用{" "}
                                    <code className="bg-muted px-1 rounded">
                                        {"{{topic}}"}
                                    </code>{" "}
                                    引用此值
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="var-num-outlines"
                                    className="text-xs font-medium"
                                >
                                    numOutlines（大纲数量）
                                </Label>
                                <Input
                                    id="var-num-outlines"
                                    type="number"
                                    min={3}
                                    max={10}
                                    value={outlineVarNumOutlines}
                                    onChange={(e) =>
                                        setOutlineVarNumOutlines(
                                            Number.parseInt(
                                                e.target.value,
                                                10,
                                            ) || 5,
                                        )
                                    }
                                    disabled={isGenerating}
                                />
                                <p className="text-xs text-muted-foreground">
                                    在 Prompt 中使用{" "}
                                    <code className="bg-muted px-1 rounded">
                                        {"{{numOutlines}}"}
                                    </code>{" "}
                                    引用此值
                                </p>
                            </div>
                        </div>
                    </div>

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
                            💡 提示：使用 {"{{topic}}"} 和 {"{{numOutlines}}"}{" "}
                            来引用上面配置的变量
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
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">
                    步骤 3/4: 题目生成 Prompt
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    自定义如何生成练习题目
                </p>
            </div>

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
                    <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                        <p className="text-sm font-medium">📝 配置变量值</p>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="var-outline-title"
                                    className="text-xs font-medium"
                                >
                                    outlineTitle（章节标题）
                                </Label>
                                <Input
                                    id="var-outline-title"
                                    value={quizVarOutlineTitle}
                                    onChange={(e) =>
                                        setQuizVarOutlineTitle(e.target.value)
                                    }
                                    placeholder="输入章节标题示例..."
                                    disabled={isGenerating}
                                />
                                <p className="text-xs text-muted-foreground">
                                    在 Prompt 中使用{" "}
                                    <code className="bg-muted px-1 rounded">
                                        {"{{outlineTitle}}"}
                                    </code>{" "}
                                    引用此值（实际生成时会自动替换为真实章节标题）
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="var-num-questions"
                                    className="text-xs font-medium"
                                >
                                    numQuestions（题目数量）
                                </Label>
                                <Input
                                    id="var-num-questions"
                                    type="number"
                                    min={3}
                                    max={10}
                                    value={quizVarNumQuestions}
                                    onChange={(e) =>
                                        setQuizVarNumQuestions(
                                            Number.parseInt(
                                                e.target.value,
                                                10,
                                            ) || 5,
                                        )
                                    }
                                    disabled={isGenerating}
                                />
                                <p className="text-xs text-muted-foreground">
                                    在 Prompt 中使用{" "}
                                    <code className="bg-muted px-1 rounded">
                                        {"{{numQuestions}}"}
                                    </code>{" "}
                                    引用此值
                                </p>
                            </div>
                        </div>
                    </div>

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
                            💡 提示：使用 {"{{outlineTitle}}"} 和{" "}
                            {"{{numQuestions}}"} 来引用上面配置的变量
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
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">步骤 4/4: 配置总览</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    确认所有配置无误后开始生成
                </p>
            </div>

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
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                    <span className="text-muted-foreground">
                                        变量 - topic:
                                    </span>
                                    <span className="font-medium">
                                        {outlineVarTopic}
                                    </span>
                                </div>
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                    <span className="text-muted-foreground">
                                        变量 - numOutlines:
                                    </span>
                                    <span className="font-medium">
                                        {outlineVarNumOutlines}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground mb-1">
                                        Prompt 内容:
                                    </p>
                                    <div className="bg-background p-3 rounded border font-mono text-xs break-words whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                                        {customOutlinePrompt}
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
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                    <span className="text-muted-foreground">
                                        变量 - outlineTitle:
                                    </span>
                                    <span className="font-medium">
                                        {quizVarOutlineTitle}
                                    </span>
                                </div>
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                    <span className="text-muted-foreground">
                                        变量 - numQuestions:
                                    </span>
                                    <span className="font-medium">
                                        {quizVarNumQuestions}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground mb-1">
                                        Prompt 内容:
                                    </p>
                                    <div className="bg-background p-3 rounded border font-mono text-xs break-words whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                                        {customQuizPrompt}
                                    </div>
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
