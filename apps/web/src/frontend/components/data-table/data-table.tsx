"use client";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { DataTablePagination } from "@/frontend/components/data-table/data-table-pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/frontend/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { getCommonPinningStyles } from "@/frontend/lib/data-table";
import { cn } from "@/frontend/lib/utils";

interface DataTableProps<TData extends { id: string | number }>
    extends React.ComponentProps<"div"> {
    table: TanstackTable<TableFeaturesConfig, TData>;
    actionBar?: React.ReactNode;
    clickable?: string;
    getClickableId?: (row: TData) => string | number;
    clickableUrl?: (row: TData) => string;
    customRender?: (rows: TData[]) => React.ReactNode;
    /** Hide the pagination footer — for fully client-capped, single-view tables. */
    hidePagination?: boolean;
}

export function DataTable<TData extends { id: string | number }>({
    table,
    actionBar,
    children,
    className,
    clickable,
    getClickableId,
    clickableUrl,
    customRender,
    hidePagination,
    ...props
}: DataTableProps<TData>) {
    const router = useRouter();
    const pathName = usePathname();

    return (
        <div
            className={cn(
                "flex w-full flex-col gap-2.5",
                // Card-grid mode (customRender, e.g. the jobs feeds) must not
                // x-scroll on the spotlight-glow bleed; table mode keeps the
                // horizontal scroll wide columns need.
                customRender ? "overflow-x-clip" : "overflow-auto",
                className,
            )}
            {...props}
        >
            {children}
            {customRender ? (
                <>
                    {table.getRowModel().rows?.length ? (
                        customRender(
                            table.getRowModel().rows.map((row) => row.original),
                        )
                    ) : (
                        <div className="flex h-24 items-center justify-center rounded-md border text-muted-foreground">
                            Sin resultados.
                        </div>
                    )}
                </>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            style={{
                                                ...getCommonPinningStyles({
                                                    column: header.column,
                                                }),
                                            }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) =>
                                    clickable ? (
                                        <React.Fragment key={row.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <TableRow
                                                        key={row.id}
                                                        data-state={
                                                            row.getIsSelected() &&
                                                            "selected"
                                                        }
                                                    >
                                                        {row
                                                            .getVisibleCells()
                                                            .map(
                                                                (
                                                                    cell,
                                                                    index,
                                                                ) => (
                                                                    <TableCell
                                                                        key={
                                                                            cell.id
                                                                        }
                                                                        style={{
                                                                            ...getCommonPinningStyles(
                                                                                {
                                                                                    column: cell.column,
                                                                                },
                                                                            ),
                                                                            cursor:
                                                                                index !==
                                                                                    0 &&
                                                                                row.getVisibleCells()
                                                                                    .length -
                                                                                    1 !==
                                                                                    index
                                                                                    ? "pointer"
                                                                                    : undefined,
                                                                        }}
                                                                        onClick={() => {
                                                                            if (
                                                                                index !==
                                                                                    0 &&
                                                                                row.getVisibleCells()
                                                                                    .length -
                                                                                    1 !==
                                                                                    index
                                                                            ) {
                                                                                if (
                                                                                    clickableUrl
                                                                                ) {
                                                                                    router.push(
                                                                                        clickableUrl(
                                                                                            row.original,
                                                                                        ),
                                                                                    );
                                                                                } else {
                                                                                    const targetId =
                                                                                        getClickableId
                                                                                            ? getClickableId(
                                                                                                  row.original,
                                                                                              )
                                                                                            : row
                                                                                                  .original
                                                                                                  .id;
                                                                                    router.push(
                                                                                        `${pathName}/${String(targetId)}`,
                                                                                    );
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        {flexRender(
                                                                            cell
                                                                                .column
                                                                                .columnDef
                                                                                .cell,
                                                                            cell.getContext(),
                                                                        )}
                                                                    </TableCell>
                                                                ),
                                                            )}
                                                    </TableRow>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{clickable}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </React.Fragment>
                                    ) : (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        style={{
                                                            ...getCommonPinningStyles(
                                                                {
                                                                    column: cell.column,
                                                                },
                                                            ),
                                                        }}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ),
                                )
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={table.getAllColumns().length}
                                        className="h-24 text-center"
                                    >
                                        Sin resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {table.getRowModel().rows?.length ? (
                            <TableFooter>
                                {table.getFooterGroups().map((footerGroup) => (
                                    <TableRow key={footerGroup.id}>
                                        {footerGroup.headers.map((footer) => (
                                            <TableCell key={footer.id}>
                                                {flexRender(
                                                    footer.column.columnDef
                                                        .footer,
                                                    footer.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableFooter>
                        ) : null}
                    </Table>
                </div>
            )}
            <div className="flex flex-col gap-2.5">
                {!hidePagination ? <DataTablePagination table={table} /> : null}
                {actionBar &&
                    table.getFilteredSelectedRowModel().rows.length > 0 &&
                    actionBar}
            </div>
        </div>
    );
}
