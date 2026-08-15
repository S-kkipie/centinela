"use client";

import { PlusIcon } from "lucide-react";
import * as React from "react";
import type { PaginatedProjects, Project } from "@/core/project/domain/types";
import { DataTable } from "@/frontend/components/data-table/data-table";
import { DataTableSortList } from "@/frontend/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/frontend/components/data-table/data-table-toolbar";
import { Button } from "@/frontend/components/ui/button";
import { useDataTable } from "@/frontend/hooks/use-data-table";
import type { DataTableRowAction } from "@/frontend/types/data-table";
import { CreateProjectModal } from "../modals/create-project-modal";
import { DeleteProjectModal } from "../modals/delete-project-modal";
import { UpdateProjectModal } from "../modals/update-project-modal";
import ProjectTableActionBar from "./action-bar";
import getProjectTableColumns from "./columns";

/**
 * Projects data-table. Streams in via `React.use(promises)` — `server.tsx`
 * hands in an *unawaited* `Promise.all([...])` so this component suspends
 * under the route's `<Suspense>` boundary while the page loads, instead of the
 * RSC blocking on the query. Filter/sort/page changes write to the URL with
 * `shallow:false` so the RSC re-runs and streams the next page in; there is no
 * client fetch here.
 */
export default function ProjectsTable({
    promises,
}: {
    promises: Promise<[PaginatedProjects]>;
}) {
    const [rowAction, setRowAction] =
        React.useState<DataTableRowAction<Project> | null>(null);
    const [createOpen, setCreateOpen] = React.useState(false);

    const [{ items, pageCount }] = React.use(promises);

    const columns = React.useMemo(
        () => getProjectTableColumns({ setRowAction }),
        [],
    );

    const { table } = useDataTable({
        data: items,
        columns,
        pageCount,
        getRowId: (row) => row.id,
        shallow: false,
        clearOnDefault: true,
        initialState: {
            sorting: [{ id: "createdAt", desc: true }],
            columnPinning: { start: [], end: ["actions"] },
        },
    });

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-semibold text-2xl">Projects</h1>
                <Button onClick={() => setCreateOpen(true)}>
                    <PlusIcon />
                    New project
                </Button>
            </div>

            <DataTable
                table={table}
                actionBar={<ProjectTableActionBar table={table} />}
            >
                <DataTableToolbar table={table}>
                    <DataTableSortList table={table} align="end" />
                </DataTableToolbar>
            </DataTable>

            <CreateProjectModal
                open={createOpen}
                onOpenChange={setCreateOpen}
            />
            {rowAction?.variant === "update" && rowAction.row && (
                <UpdateProjectModal
                    open
                    onOpenChange={() => setRowAction(null)}
                    project={rowAction.row.original}
                />
            )}
            {rowAction?.variant === "delete" && rowAction.row && (
                <DeleteProjectModal
                    open
                    onOpenChange={() => setRowAction(null)}
                    project={rowAction.row.original}
                    onSuccess={() => rowAction.row.toggleSelected(false)}
                />
            )}
        </div>
    );
}
