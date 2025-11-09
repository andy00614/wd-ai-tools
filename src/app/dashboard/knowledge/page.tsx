"use client";

import { Button } from "@/components/ui/button";
import KnowledgeListTable from "@/modules/knowledge/components/knowledge-list-table";

export default function KnowledgePage() {
    // Hardcoded fake data for testing
    const fakeSessions = [
        {
            id: "1",
            title: "React Hooks 基础知识",
            model: "openai/gpt-4o",
            status: "completed",
            createdAt: new Date("2025-01-08"),
        },
    ];

    return (
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">
                    Knowledge Point Generator
                </h1>
                <Button>+ Create</Button>
            </div>

            <KnowledgeListTable sessions={fakeSessions} />
        </div>
    );
}
