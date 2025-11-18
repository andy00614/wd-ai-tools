"use client";

import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import {
    Activity,
    Calendar,
    DollarSign,
    FileText,
    Eye,
    Trash2,
    Clock,
    BookOpen,
    HelpCircle,
} from "lucide-react";
import * as React from "react";
import { useState, useTransition } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/use-data-table";
import { formatCost } from "@/lib/pricing";
import type { KnowledgeSession } from "../models/knowledge.model";
import DetailDialog from "./detail-dialog";
import { deleteSession } from "../actions/delete-session.action";
import toast from "react-hot-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
    sessions: KnowledgeSession[];
};

export default function KnowledgeDataTable({ sessions }: Props) {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
        null,
    );
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!sessionToDelete) return;

        startTransition(async () => {
            const result = await deleteSession(sessionToDelete);
            if (result.success) {
                toast.success("Session deleted successfully");
                setDeleteDialogOpen(false);
                setSessionToDelete(null);
            } else {
                toast.error(result.error || "Failed to delete session");
            }
        });
    };

    const columns = React.useMemo<ColumnDef<KnowledgeSession>[]>(
        () => [
            {
                id: "title",
                accessorKey: "title",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Title" />
                ),
                cell: ({ row }) => {
                    const title = row.getValue("title") as string;
                    return (
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium max-w-[300px] truncate">
                                {title}
                            </span>
                        </div>
                    );
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: "model",
                accessorKey: "model",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Model" />
                ),
                cell: ({ row }) => {
                    const model = row.getValue("model") as string;
                    return (
                        <span className="text-sm text-muted-foreground font-mono">
                            {model}
                        </span>
                    );
                },
                enableSorting: true,
                enableColumnFilter: true,
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id));
                },
            },
            {
                id: "status",
                accessorKey: "status",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Status" />
                ),
                cell: ({ row }) => {
                    const status = row.getValue("status") as string;
                    return (
                        <Badge
                            variant={
                                status === "completed" ? "default" : "secondary"
                            }
                        >
                            <Activity className="mr-1 h-3 w-3" />
                            {status}
                        </Badge>
                    );
                },
                enableSorting: true,
                enableColumnFilter: true,
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id));
                },
            },
            {
                id: "numOutlines",
                accessorKey: "numOutlines",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title="Num Outlines"
                    />
                ),
                cell: ({ row }) => {
                    const count = row.getValue("numOutlines") as number;
                    return (
                        <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">
                                {count ?? 0}
                            </span>
                        </div>
                    );
                },
                enableSorting: true,
            },
            {
                id: "questionsPerOutline",
                accessorKey: "questionsPerOutline",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title="Questions Per Outline"
                    />
                ),
                cell: ({ row }) => {
                    const count = row.getValue("questionsPerOutline") as
                        | number
                        | null;
                    return (
                        <div className="flex items-center gap-1">
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">
                                {count ?? 0}
                            </span>
                        </div>
                    );
                },
                enableSorting: true,
            },
            {
                id: "cost",
                accessorKey: "cost",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Cost" />
                ),
                cell: ({ row }) => {
                    const cost = row.getValue("cost") as string | null;
                    if (!cost)
                        return <span className="text-muted-foreground">-</span>;
                    return (
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm text-primary">
                                {formatCost(Number.parseFloat(cost))}
                            </span>
                        </div>
                    );
                },
                enableSorting: true,
            },
            {
                id: "timeConsume",
                accessorKey: "timeConsume",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Time" />
                ),
                cell: ({ row }) => {
                    const timeMs = row.getValue("timeConsume") as number | null;
                    if (!timeMs)
                        return <span className="text-muted-foreground">-</span>;
                    const seconds = (timeMs / 1000).toFixed(1);
                    return (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">
                                {seconds}s
                            </span>
                        </div>
                    );
                },
                enableSorting: true,
            },
            {
                id: "createdAt",
                accessorKey: "createdAt",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Created" />
                ),
                cell: ({ row }) => {
                    const date = row.getValue("createdAt") as Date;
                    const formattedDateFull = dayjs(date).format(
                        "MMM DD, YYYY HH:mm:ss",
                    );
                    const formattedDateShort = dayjs(date).format("MMM DD");
                    return (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="hidden md:inline">
                                {formattedDateFull}
                            </span>
                            <span className="md:hidden">{formattedDateShort}</span>
                        </div>
                    );
                },
                enableSorting: true,
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const session = row.original;
                    return (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    setSelectedSessionId(session.id);
                                    setDetailOpen(true);
                                }}
                                title="View Details"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                    setSessionToDelete(session.id);
                                    setDeleteDialogOpen(true);
                                }}
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [],
    );

    const { table } = useDataTable({
        data: sessions,
        columns,
        initialState: {
            sorting: [{ id: "createdAt", desc: true }],
            pagination: { pageIndex: 0, pageSize: 10 },
        },
        getRowId: (row) => row.id,
    });

    // Show empty state if no sessions
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border rounded-md">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                    No knowledge sessions yet
                </h3>
                <p className="text-sm text-muted-foreground">
                    Click the "+ Create" button above to create your first
                    knowledge point
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <DataTableToolbar
                    table={table}
                    searchColumn="title"
                    searchPlaceholder="Search titles..."
                >
                    {table.getColumn("status") && (
                        <DataTableFacetedFilter
                            column={table.getColumn("status")}
                            title="Status"
                            options={[
                                { label: "Completed", value: "completed" },
                                { label: "Pending", value: "pending" },
                                {
                                    label: "Generating Outline",
                                    value: "generating_outline",
                                },
                                {
                                    label: "Generating Questions",
                                    value: "generating_questions",
                                },
                                { label: "Failed", value: "failed" },
                                { label: "Cancelled", value: "cancelled" },
                            ]}
                        />
                    )}
                    {table.getColumn("model") && (
                        <DataTableFacetedFilter
                            column={table.getColumn("model")}
                            title="Model"
                            options={[
                                { label: "GPT-5", value: "azure/gpt-5" },
                                {
                                    label: "GPT-4.1-mini",
                                    value: "azure/gpt-4.1-mini",
                                },
                                { label: "GPT-4o", value: "azure/gpt-4o" },
                                {
                                    label: "Gemini 2.5 Flash",
                                    value: "google/gemini-2.5-flash",
                                },
                            ]}
                        />
                    )}
                </DataTableToolbar>
                <DataTable table={table} />
                <DataTablePagination table={table} />
            </div>

            <DetailDialog
                sessionId={selectedSessionId}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this knowledge
                            session? This action cannot be undone and will also
                            delete all associated outlines and questions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
