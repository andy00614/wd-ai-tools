import KnowledgeDataTable from "@/modules/knowledge/components/knowledge-data-table";
import { getSessions } from "@/modules/knowledge/actions/get-sessions.action";
import { getAllAiModels } from "@/modules/ai-model/actions/seed-models.action";
import KnowledgePageClient from "@/modules/knowledge/components/knowledge-page-client";

export default async function KnowledgePage() {
    const result = await getSessions();
    const sessions = result.success ? result.data : [];

    const modelsResult = await getAllAiModels();
    const aiModels =
        modelsResult.success && modelsResult.data
            ? modelsResult.data.filter((m) => m.isActive)
            : [];

    return <KnowledgePageClient sessions={sessions} aiModels={aiModels} />;
}
