import Link from "next/link";
import { Button } from "@/components/ui/button";
import KnowledgeDataTable from "@/modules/knowledge/components/knowledge-data-table";
import { getSessions } from "@/modules/knowledge/actions/get-sessions.action";

export default async function KnowledgePage() {
    const result = await getSessions();
    const sessions = result.success ? result.data : [];

    return (
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">
                    Knowledge Point Generator
                </h1>
                <Link href="/dashboard/knowledge/new">
                    <Button>+ Create</Button>
                </Link>
            </div>

            <KnowledgeDataTable sessions={sessions} />
        </div>
    );
}
