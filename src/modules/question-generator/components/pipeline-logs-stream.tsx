"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ChevronRight,
    CheckCircle,
    XCircle,
    Loader2,
    Clock,
    Code,
} from "lucide-react";
import type { PipelineLog } from "../models/question-generator.model";

interface PipelineLogsStreamProps {
    logs: PipelineLog[];
    isStreaming?: boolean;
}

export function PipelineLogsStream({
    logs,
    isStreaming = false,
}: PipelineLogsStreamProps) {
    const [isExpanded, setIsExpanded] = useState(true); // 默认展开
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

    // 自动展开正在运行的步骤
    useEffect(() => {
        const runningIndex = logs.findIndex((log) => log.status === "running");
        if (runningIndex !== -1) {
            setExpandedSteps((prev) => new Set(prev).add(runningIndex));
        }
    }, [logs]);

    const toggleStep = (index: number) => {
        setExpandedSteps((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const getStatusIcon = (status: PipelineLog["status"]) => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "running":
                return (
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                );
            default:
                return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getStatusColor = (status: PipelineLog["status"]) => {
        switch (status) {
            case "success":
                return "border-l-green-500 bg-green-50/50 dark:bg-green-950/20";
            case "error":
                return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20";
            case "running":
                return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse";
            default:
                return "border-l-muted-foreground bg-muted/20";
        }
    };

    if (logs.length === 0) {
        return null;
    }

    return (
        <Card className="border">
            <CardContent className="p-3">
                <Button
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full justify-between h-8 text-sm font-semibold hover:bg-muted"
                >
                    <span className="flex items-center gap-2">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        Pipeline 执行日志
                        {isStreaming && (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        )}
                        <span className="text-xs font-normal text-muted-foreground">
                            ({logs.length} 个步骤)
                        </span>
                    </span>
                </Button>

                {isExpanded && (
                    <div className="mt-3 space-y-2">
                        {logs.map((log, index) => (
                            <div
                                key={index}
                                className={`border-l-4 rounded-r p-2 transition-all ${getStatusColor(log.status)}`}
                            >
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => toggleStep(index)}
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        {getStatusIcon(log.status)}
                                        <span className="text-sm font-medium">
                                            {log.step}
                                        </span>
                                        {log.duration !== undefined && (
                                            <span className="text-xs text-muted-foreground">
                                                (
                                                {(log.duration / 1000).toFixed(
                                                    2,
                                                )}
                                                s)
                                            </span>
                                        )}
                                    </div>
                                    {(log.details ||
                                        log.prompt ||
                                        log.response) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                        >
                                            {expandedSteps.has(index) ? (
                                                <ChevronDown className="h-3 w-3" />
                                            ) : (
                                                <ChevronRight className="h-3 w-3" />
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {log.error && (
                                    <div className="mt-1 text-xs text-red-600 dark:text-red-400 ml-6">
                                        错误: {log.error}
                                    </div>
                                )}

                                {expandedSteps.has(index) && (
                                    <div className="mt-2 ml-6 space-y-2">
                                        {/* Prompt Section */}
                                        {log.prompt && (
                                            <div className="p-2 bg-background/50 rounded border">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Code className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs font-semibold text-foreground">
                                                        AI Prompt:
                                                    </span>
                                                </div>
                                                <pre className="overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                                    {log.prompt}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Details Section */}
                                        {log.details && (
                                            <div className="p-2 bg-background/50 rounded border">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        执行详情:
                                                    </span>
                                                </div>
                                                <pre className="overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                                    {JSON.stringify(
                                                        log.details,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Response Section */}
                                        {log.response && (
                                            <div className="p-2 bg-background/50 rounded border">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        AI 响应:
                                                    </span>
                                                </div>
                                                <pre className="overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                                    {JSON.stringify(
                                                        log.response,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
