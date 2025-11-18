"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import KnowledgeDataTable from "./knowledge-data-table";
import CreateKnowledgeDialog from "./create-knowledge-dialog";
import type { AiModel } from "@/modules/ai-model/schemas/ai-model.schema";
import { Plus } from "lucide-react";
import type { knowledgeSessions } from "../schemas/knowledge.schema";

type Session = typeof knowledgeSessions.$inferSelect;

type Props = {
    sessions: Session[];
    aiModels: AiModel[];
};

export default function KnowledgePageClient({ sessions, aiModels }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Knowledge Library
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        管理您的知识库和学习内容
                    </p>
                </div>
                <Button
                    onClick={() => setDialogOpen(true)}
                    size="default"
                    className="gap-2 md:size-lg w-full md:w-auto"
                >
                    <Plus className="size-4" />
                    <span className="md:inline">创建知识</span>
                </Button>
            </div>

            <KnowledgeDataTable sessions={sessions} />

            <CreateKnowledgeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                aiModels={aiModels}
            />
        </div>
    );
}
