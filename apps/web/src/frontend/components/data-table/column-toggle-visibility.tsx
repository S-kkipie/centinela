/** biome-ignore-all lint/suspicious/noExplicitAny: false positive */
"use client";

import type { Table } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import { Settings2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";

export function DataTableViewOptions<TData extends RowData>({
    table,
}: {
    table: Table<TableFeaturesConfig, TData>;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto hidden h-8 lg:flex"
                >
                    <Settings2 />
                    Ver
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>Visibilidad</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== "undefined" &&
                            column.getCanHide(),
                    )
                    .map((column) => {
                        return (
                            (column.columnDef.meta as any)?.title && (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                >
                                    {(column.columnDef.meta as any)?.title ??
                                        ""}
                                </DropdownMenuCheckboxItem>
                            )
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
