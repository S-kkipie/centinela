import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import { EllipsisIcon, TagIcon, TextIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Project, ProjectStatus } from "@/core/project/domain/types";
import DescriptionCell from "@/frontend/components/data-table/description-cell";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { formatDate } from "@/frontend/lib/format";
import type { DataTableRowAction } from "@/frontend/types/data-table";

const STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
    { label: "Active", value: "active" },
    { label: "Archived", value: "archived" },
];

interface GetProjectTableColumnsProps {
    setRowAction: Dispatch<SetStateAction<DataTableRowAction<Project> | null>>;
}

/**
 * Column definitions for the projects data table. Headers are plain `<div>`s —
 * sorting is driven by `DataTableSortList` in the toolbar, not per-column
 * header clicks. `name`/`status` carry `enableColumnFilter` + `meta.variant` so
 * the toolbar's filter drawer renders a control for them and `useDataTable`
 * wires a matching `?name=`/`?status=` URL parser (see `search-params.ts`). The
 * `actions` column funnels Edit/Delete into `setRowAction`, read back by
 * `ProjectsTable` to drive the edit/delete dialogs.
 */
export default function getProjectTableColumns({
    setRowAction,
}: GetProjectTableColumnsProps): ColumnDef<TableFeaturesConfig, Project>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                    className="translate-y-0.5"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-0.5"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        {
            id: "name",
            accessorKey: "name",
            header: () => <div className="font-medium">Name</div>,
            cell: ({ row }) => (
                <span className="block max-w-64 truncate font-medium">
                    {row.original.name}
                </span>
            ),
            enableSorting: true,
            enableColumnFilter: true,
            meta: {
                label: "Name",
                placeholder: "Search by name…",
                variant: "text",
                icon: TextIcon,
            },
        },
        {
            id: "description",
            accessorKey: "description",
            header: () => <div className="font-medium">Description</div>,
            cell: ({ row }) => (
                <DescriptionCell
                    description={row.original.description ?? "—"}
                />
            ),
            enableSorting: false,
            enableColumnFilter: false,
            meta: { label: "Description" },
        },
        {
            id: "status",
            accessorKey: "status",
            header: () => <div className="font-medium">Status</div>,
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.status}</Badge>
            ),
            enableSorting: true,
            enableColumnFilter: true,
            meta: {
                label: "Status",
                variant: "select",
                icon: TagIcon,
                options: STATUS_OPTIONS,
            },
        },
        {
            id: "createdAt",
            accessorKey: "createdAt",
            header: () => <div className="font-medium">Created</div>,
            cell: ({ cell }) => (
                <span className="text-muted-foreground text-sm">
                    {formatDate(cell.getValue<string>())}
                </span>
            ),
            enableSorting: true,
            enableColumnFilter: false,
            meta: { label: "Created" },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Open project actions"
                        >
                            <EllipsisIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onSelect={() =>
                                setRowAction({ row, variant: "update" })
                            }
                        >
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                                setRowAction({ row, variant: "delete" })
                            }
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
    ];
}
