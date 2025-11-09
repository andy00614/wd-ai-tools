"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KnowledgeSession } from "../models/knowledge.model";

type Props = {
    sessions: KnowledgeSession[];
};

export default function KnowledgeListTable({ sessions }: Props) {
    if (sessions.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">暂无数据</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        点击上方「+ Create」按钮创建第一个知识点
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <Card key={session.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-lg">
                                    {session.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {session.model} ·{" "}
                                    {session.createdAt.toLocaleDateString()}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    session.status === "completed"
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {session.status}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}
