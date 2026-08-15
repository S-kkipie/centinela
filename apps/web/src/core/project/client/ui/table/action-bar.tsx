"use client";

import type { Table } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/core/project/domain/types";
import {
    DataTableActionBar,
    DataTableActionBarAction,
    DataTableActionBarSelection,
} from "@/frontend/components/data-table/data-table-action-bar";
import { Separator } from "@/frontend/components/ui/separator";
import { exportTableToCSV } from "@/frontend/lib/export";

/** Bulk action bar shown over the projects table while rows are selected. */
export default function ProjectTableActionBar({
    table,
}: {
    table: Table<TableFeaturesConfig, Project>;
}) {
    return (
        <DataTableActionBar table={table}>
            <DataTableActionBarSelection table={table} />
            <Separator
                orientation="vertical"
                className="hidden data-[orientation=vertical]:h-5 sm:block"
            />
            <DataTableActionBarAction
                tooltip="Export"
                onClick={() => {
                    exportTableToCSV(table, {
                        filename: "projects",
                        excludeColumns: ["select", "actions"],
                        onlySelected: true,
                    });
                    toast.success("Exported");
                }}
            >
                <DownloadIcon />
            </DataTableActionBarAction>
        </DataTableActionBar>
    );
}
