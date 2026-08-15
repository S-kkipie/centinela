"use client";

import type { Table } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import { Check, ChevronsUpDown, Settings2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/frontend/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/frontend/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/frontend/components/ui/popover";
import { cn } from "@/frontend/lib/utils";

interface DataTableViewOptionsProps<TData extends RowData> {
    table: Table<TableFeaturesConfig, TData>;
}

export function DataTableViewOptions<TData extends RowData>({
    table,
}: DataTableViewOptionsProps<TData>) {
    const columns = React.useMemo(
        () =>
            table
                .getAllColumns()
                .filter(
                    (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide(),
                ),
        [table],
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    aria-label="Toggle columns"
                    role="combobox"
                    variant="outline"
                    size="sm"
                    className="ml-auto hidden h-8 lg:flex"
                >
                    <Settings2 />
                    {"Ver"}
                    <ChevronsUpDown className="ml-auto opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-0">
                <Command>
                    <CommandInput placeholder={"Buscar columnas..."} />
                    <CommandList>
                        <CommandEmpty>
                            {"No se encontraron columnas"}
                        </CommandEmpty>
                        <CommandGroup>
                            {columns.map((column) => (
                                <CommandItem
                                    key={column.id}
                                    onSelect={() =>
                                        column.toggleVisibility(
                                            !column.getIsVisible(),
                                        )
                                    }
                                >
                                    <span className="truncate">
                                        {column.columnDef.meta?.label ??
                                            column.id}
                                    </span>
                                    <Check
                                        className={cn(
                                            "ml-auto size-4 shrink-0",
                                            column.getIsVisible()
                                                ? "opacity-100"
                                                : "opacity-0",
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
