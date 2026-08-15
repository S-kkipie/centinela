import type { Table } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

import { Button } from "@/frontend/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";
import { cn } from "@/frontend/lib/utils";

interface DataTablePaginationProps<TData extends RowData> extends React.ComponentProps<"div"> {
    table: Table<TableFeaturesConfig, TData>;
    pageSizeOptions?: number[];
}

export function DataTablePagination<TData extends RowData>({
    table,
    pageSizeOptions = [5, 10, 20, 30, 40, 50, 999],
    className,
    ...props
}: DataTablePaginationProps<TData>) {
    return (
        <div
            className={cn(
                "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8",
                className,
            )}
            {...props}
        >
            <div className="flex-1 whitespace-nowrap text-muted-foreground text-sm">
                {"{count} de {total} fila(s) seleccionada(s)."
                    .replace(
                        "{count}",
                        `${table.getFilteredSelectedRowModel().rows.length}`,
                    )
                    .replace(
                        "{total}",
                        `${table.getFilteredRowModel().rows.length}`,
                    )}
            </div>
            <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                    <p className="whitespace-nowrap font-medium text-sm">
                        {"Filas por página"}
                    </p>
                    <Select
                        value={`${table.store.state.pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-18 data-size:h-8">
                            <SelectValue
                                placeholder={
                                    table.store.state.pagination.pageSize
                                }
                            />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizeOptions.map((pageSize) => {
                                return (
                                    <SelectItem
                                        key={pageSize}
                                        value={`${pageSize}`}
                                    >
                                        {pageSize === 999 ? "Todos" : pageSize}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-center font-medium text-sm">
                    {"Página {current} de {total}"
                        .replace(
                            "{current}",
                            `${table.store.state.pagination.pageIndex + 1}`,
                        )
                        .replace("{total}", `${table.getPageCount()}`)}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        aria-label={"Ir a la primera página"}
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft />
                    </Button>
                    <Button
                        aria-label={"Ir a la página anterior"}
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        aria-label={"Ir a la página siguiente"}
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight />
                    </Button>
                    <Button
                        aria-label={"Ir a la última página"}
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                        }
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    );
}
