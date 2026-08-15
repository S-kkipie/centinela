"use client";

import type { Column, Table } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import { Filter, X } from "lucide-react";
import * as React from "react";

import { DataTableDateFilter } from "@/frontend/components/data-table/data-table-date-filter";
import { LocationCascadeFilter } from "@/frontend/components/data-table/data-table-location-cascade-filter";
import { DataTableViewOptions } from "@/frontend/components/data-table/data-table-view-options";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/frontend/components/ui/drawer";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { Separator } from "@/frontend/components/ui/separator";
import { Slider } from "@/frontend/components/ui/slider";
import { cn } from "@/frontend/lib/utils";
import type { Option } from "@/frontend/types/data-table";

/**
 * Props for the DataTableToolbar component.
 */
interface DataTableToolbarProps<TData extends RowData> extends React.ComponentProps<"div"> {
    table: Table<TableFeaturesConfig, TData>;
    hideSort?: boolean;
    hideViewOptions?: boolean;
}

/**
 * Renders the toolbar for the data table, including a drawer for inline filters.
 *
 * @param props - The component props
 * @returns The rendered toolbar
 */
export function DataTableToolbar<TData extends RowData>({
    table,
    children,
    className,
    hideSort,
    hideViewOptions,
    ...props
}: DataTableToolbarProps<TData>) {
    const [open, setOpen] = React.useState(false);
    const isFiltered = table.store.state.columnFilters.length > 0;

    const columns = React.useMemo(
        () => table.getAllColumns().filter((column) => column.getCanFilter()),
        [table],
    );

    const activeFiltersCount = React.useMemo(() => {
        return table.store.state.columnFilters.length;
    }, [table]);

    const onReset = React.useCallback(() => {
        table.resetColumnFilters();
    }, [table]);

    return (
        <div
            role="toolbar"
            aria-orientation="horizontal"
            className={cn(
                "flex w-full items-center justify-between gap-2 p-1",
                className,
            )}
            {...props}
        >
            <div className="flex items-center gap-2">
                <Drawer
                    open={open}
                    onOpenChange={setOpen}
                    direction="right"
                    dismissible={false}
                >
                    <DrawerTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="relative bg-transparent"
                        >
                            <Filter className="h-4 w-4" />
                            {"Filtros"}
                            {activeFiltersCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                                >
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-75 sm:w-100 rounded-none">
                        <DrawerHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <DrawerTitle>{"Filtros"}</DrawerTitle>
                                <DrawerDescription>
                                    {"Filtrar los resultados de la tabla"}
                                </DrawerDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DrawerHeader>
                        <ScrollArea className="min-h-0 flex-1 px-4">
                            <div className="space-y-6 pb-4">
                                {columns.map((column) => (
                                    <DrawerFilterSection
                                        key={column.id}
                                        column={column}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                        {isFiltered && (
                            <DrawerFooter className="gap-2 sm:space-x-0">
                                <Button
                                    aria-label="Reiniciar filtros"
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed bg-transparent"
                                    onClick={onReset}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    {"Limpiar filtros"}
                                </Button>
                            </DrawerFooter>
                        )}
                    </DrawerContent>
                </Drawer>
            </div>

            <div className="flex items-center gap-2">
                {!hideSort && children}
                {!hideViewOptions && <DataTableViewOptions table={table} />}
            </div>
        </div>
    );
}

/**
 * Props for the DrawerFilterSection component.
 */
interface DrawerFilterSectionProps<TData extends RowData> {
    column: Column<TableFeaturesConfig, TData, unknown>;
}

/**
 * Renders a section for a specific column filter within the drawer.
 *
 * @param props - The component props
 * @returns The rendered filter section
 */
function DrawerFilterSection<TData extends RowData>({
    column,
}: DrawerFilterSectionProps<TData>) {
    const columnMeta = column.columnDef.meta;
    const hasValue = column.getFilterValue() !== undefined;
    const Icon = columnMeta?.icon;

    const onClear = React.useCallback(() => {
        column.setFilterValue(undefined);
    }, [column]);

    if (!columnMeta?.variant) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm font-medium">
                        {columnMeta.label ?? column.id}
                    </span>
                    {hasValue && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                </div>
                {hasValue && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {columnMeta.placeholder && (
                <p className="text-xs text-muted-foreground">
                    {columnMeta.placeholder}
                </p>
            )}
            <Separator />
            <InlineFilterControl column={column} />
        </div>
    );
}

/**
 * Props for the InlineFilterControl component.
 */
interface InlineFilterControlProps<TData extends RowData> {
    column: Column<TableFeaturesConfig, TData, unknown>;
}

/**
 * Renders the appropriate inline filter control based on the column's variant.
 *
 * @param props - The component props
 * @returns The rendered inline filter control
 */
function InlineFilterControl<TData extends RowData>({
    column,
}: InlineFilterControlProps<TData>) {
    const columnMeta = column.columnDef.meta;
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
        case "text":
            return (
                <Input
                    placeholder={columnMeta.placeholder ?? columnMeta.label}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        column.setFilterValue(event.target.value)
                    }
                    className="w-full h-8"
                />
            );

        case "number":
            return (
                <div className="relative">
                    <Input
                        type="number"
                        inputMode="numeric"
                        placeholder={columnMeta.placeholder ?? columnMeta.label}
                        value={(column.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            column.setFilterValue(event.target.value)
                        }
                        className={cn("w-full h-8", columnMeta.unit && "pr-8")}
                    />
                    {columnMeta.unit && (
                        <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                            {columnMeta.unit}
                        </span>
                    )}
                </div>
            );

        case "range":
            return <InlineRangeFilter column={column} />;

        case "date":
        case "dateRange":
            return (
                <DataTableDateFilter
                    column={column}
                    title={columnMeta.label ?? column.id}
                    multiple={columnMeta.variant === "dateRange"}
                />
            );

        case "select":
            return <InlineSelectFilter column={column} />;

        case "multiSelect":
            return <InlineMultiSelectFilter column={column} />;

        case "locationCascade":
            return <LocationCascadeFilter column={column} />;

        default:
            return null;
    }
}

/**
 * Props for the InlineMultiSelectFilter component.
 */
interface InlineMultiSelectFilterProps<TData extends RowData> {
    column: Column<TableFeaturesConfig, TData, unknown>;
}

/**
 * Renders an inline multi-select filter using checkboxes.
 *
 * @param props - The component props
 * @returns The rendered multi-select filter
 */
function InlineMultiSelectFilter<TData extends RowData>({
    column,
}: InlineMultiSelectFilterProps<TData>) {
    const columnMeta = column.columnDef.meta;
    const options = columnMeta?.options ?? [];
    const columnFilterValue = column.getFilterValue();
    const selectedValues = new Set(
        Array.isArray(columnFilterValue) ? columnFilterValue : [],
    );

    const onCheckedChange = React.useCallback(
        (option: Option, checked: boolean) => {
            const newSelectedValues = new Set(selectedValues);
            if (checked) {
                newSelectedValues.add(option.value);
            } else {
                newSelectedValues.delete(option.value);
            }
            const filterValues = Array.from(newSelectedValues);
            column.setFilterValue(
                filterValues.length ? filterValues : undefined,
            );
        },
        [column, selectedValues],
    );

    return (
        <div className="space-y-2">
            {options.map((option) => {
                const id = `${column.id}-${option.value}`;
                const isChecked = selectedValues.has(option.value);
                return (
                    <div
                        key={option.value}
                        className="flex items-center space-x-2"
                    >
                        <Checkbox
                            id={id}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                                onCheckedChange(option, checked as boolean)
                            }
                        />
                        <Label
                            htmlFor={id}
                            className="flex flex-1 items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                            {option.icon && <option.icon className="h-4 w-4" />}
                            {option.label}
                            {option.count !== undefined && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {option.count}
                                </span>
                            )}
                        </Label>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Props for the InlineSelectFilter component.
 */
interface InlineSelectFilterProps<TData extends RowData> {
    column: Column<TableFeaturesConfig, TData, unknown>;
}

/**
 * Renders an inline select filter using toggle buttons.
 *
 * @param props - The component props
 * @returns The rendered select filter
 */
function InlineSelectFilter<TData extends RowData>({ column }: InlineSelectFilterProps<TData>) {
    const columnMeta = column.columnDef.meta;
    const options = columnMeta?.options ?? [];
    const columnFilterValue = column.getFilterValue();
    const selectedValue = Array.isArray(columnFilterValue)
        ? columnFilterValue[0]
        : undefined;

    const onClick = React.useCallback(
        (value: string) => {
            if (selectedValue === value) {
                column.setFilterValue(undefined);
            } else {
                column.setFilterValue([value]);
            }
        },
        [column, selectedValue],
    );

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const isSelected = selectedValue === option.value;
                return (
                    <Button
                        key={option.value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onClick(option.value)}
                        className="h-8"
                    >
                        {option.icon && (
                            <option.icon className="mr-2 h-4 w-4" />
                        )}
                        {option.label}
                    </Button>
                );
            })}
        </div>
    );
}

interface Range {
    min: number;
    max: number;
}

type RangeValue = [number, number];

function getIsValidRange(value: unknown): value is RangeValue {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === "number" &&
        typeof value[1] === "number"
    );
}

/**
 * Props for the InlineRangeFilter component.
 */
interface InlineRangeFilterProps<TData extends RowData> {
    column: Column<TableFeaturesConfig, TData, unknown>;
}

/**
 * Renders an inline range filter using a slider and number inputs.
 *
 * @param props - The component props
 * @returns The rendered range filter
 */
function InlineRangeFilter<TData extends RowData>({ column }: InlineRangeFilterProps<TData>) {
    const id = React.useId();
    const columnFilterValue = getIsValidRange(column.getFilterValue())
        ? (column.getFilterValue() as RangeValue)
        : undefined;

    const defaultRange = column.columnDef.meta?.range;
    const unit = column.columnDef.meta?.unit;

    const { min, max, step } = React.useMemo<Range & { step: number }>(() => {
        let minValue = 0;
        let maxValue = 100;

        if (defaultRange && getIsValidRange(defaultRange)) {
            [minValue, maxValue] = defaultRange;
        } else {
            const values = column.getFacetedMinMaxValues();

            if (values && Array.isArray(values) && values.length === 2) {
                const [facetMinValue, facetMaxValue] = values;

                if (
                    typeof facetMinValue === "number" &&
                    typeof facetMaxValue === "number"
                ) {
                    minValue = facetMinValue;
                    maxValue = facetMaxValue;
                }
            }
        }

        const rangeSize = maxValue - minValue;
        const step =
            rangeSize <= 20
                ? 1
                : rangeSize <= 100
                  ? Math.ceil(rangeSize / 20)
                  : Math.ceil(rangeSize / 50);

        return { min: minValue, max: maxValue, step };
    }, [column, defaultRange]);

    const range = React.useMemo((): RangeValue => {
        return columnFilterValue ?? [min, max];
    }, [columnFilterValue, min, max]);

    const onFromInputChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const numValue = Number(event.target.value);

            if (
                !Number.isNaN(numValue) &&
                numValue >= min &&
                numValue <= range[1]
            ) {
                column.setFilterValue([numValue, range[1]]);
            }
        },
        [column, min, range],
    );

    const onToInputChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const numValue = Number(event.target.value);

            if (
                !Number.isNaN(numValue) &&
                numValue <= max &&
                numValue >= range[0]
            ) {
                column.setFilterValue([range[0], numValue]);
            }
        },
        [column, max, range],
    );

    const onSliderValueChange = React.useCallback(
        (value: RangeValue) => {
            if (Array.isArray(value) && value.length === 2) {
                column.setFilterValue(value);
            }
        },
        [column],
    );

    return (
        <div className="flex flex-col gap-4">
            <Slider
                id={`${id}-slider`}
                min={min}
                max={max}
                step={step}
                value={range}
                onValueChange={onSliderValueChange}
            />
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        id={`${id}-from`}
                        type="number"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={min.toString()}
                        min={min}
                        max={max}
                        value={range[0]?.toString()}
                        onChange={onFromInputChange}
                        className={cn("h-8", unit && "pr-8")}
                    />
                    {unit && (
                        <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                            {unit}
                        </span>
                    )}
                </div>
                <span className="text-muted-foreground">—</span>
                <div className="relative flex-1">
                    <Input
                        id={`${id}-to`}
                        type="number"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={max.toString()}
                        min={min}
                        max={max}
                        value={range[1]?.toString()}
                        onChange={onToInputChange}
                        className={cn("h-8", unit && "pr-8")}
                    />
                    {unit && (
                        <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                            {unit}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
