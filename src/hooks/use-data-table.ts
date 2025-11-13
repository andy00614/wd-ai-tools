import * as React from "react";
import type {
    ColumnDef,
    ColumnFiltersState,
    PaginationState,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table";
import {
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

interface UseDataTableProps<TData, TValue> {
    data: TData[];
    columns: ColumnDef<TData, TValue>[];
    pageCount?: number;
    initialState?: {
        sorting?: SortingState;
        pagination?: PaginationState;
        columnVisibility?: VisibilityState;
    };
    getRowId?: (row: TData) => string;
}

export function useDataTable<TData, TValue>({
    data,
    columns,
    pageCount,
    initialState,
    getRowId,
}: UseDataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>(
        initialState?.sorting ?? [],
    );
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
    const [pagination, setPagination] = React.useState<PaginationState>(
        initialState?.pagination ?? {
            pageIndex: 0,
            pageSize: 10,
        },
    );

    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        manualPagination: !!pageCount,
        getRowId,
    });

    return { table };
}
