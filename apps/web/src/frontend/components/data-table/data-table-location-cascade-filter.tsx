"use client";

import type { Column } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import * as React from "react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";

type LocationTree = Record<string, Record<string, string[]>>;

export type LocationValue = {
    level1?: string;
    level2?: string;
    level3?: string;
};
type Level = keyof LocationValue;

/** The selectable options at each level given the current selection. */
export function cascadeOptions(
    tree: LocationTree,
    value: LocationValue,
): { level1: string[]; level2: string[]; level3: string[] } {
    const level1 = Object.keys(tree).sort();
    const byL2 = value.level1 ? (tree[value.level1] ?? {}) : {};
    const level2 = Object.keys(byL2).sort();
    const level3 =
        value.level1 && value.level2 ? [...(byL2[value.level2] ?? [])] : [];
    return { level1, level2, level3 };
}

/** Sets `level` to `next` and clears every level below it (empty -> undefined). */
export function clearBelow(
    value: LocationValue,
    level: Level,
    next: string | undefined,
): LocationValue {
    if (level === "level1") {
        return next ? { level1: next } : {};
    }
    if (level === "level2") {
        return next
            ? { level1: value.level1, level2: next }
            : { level1: value.level1 };
    }
    return next
        ? { ...value, level3: next }
        : { level1: value.level1, level2: value.level2 };
}

const ALL = "__all__";

function LevelSelect({
    label,
    value,
    options,
    disabled,
    onChange,
}: {
    label: string;
    value: string | undefined;
    options: string[];
    disabled: boolean;
    onChange: (next: string | undefined) => void;
}) {
    return (
        <Select
            value={value ?? ALL}
            disabled={disabled}
            onValueChange={(v) => onChange(v === ALL ? undefined : v)}
        >
            <SelectTrigger className="w-full" aria-label={label}>
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL}>{label}</SelectItem>
                {options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                        {opt}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function LocationCascadeFilter<TData extends RowData>({
    column,
}: {
    column: Column<TableFeaturesConfig, TData, unknown>;
}) {
    const tree: LocationTree = column.columnDef.meta?.locationTree ?? {};
    const value = (column.getFilterValue() as LocationValue | undefined) ?? {};
    const opts = cascadeOptions(tree, value);

    const set = React.useCallback(
        (level: Level, next: string | undefined) => {
            const current =
                (column.getFilterValue() as LocationValue | undefined) ?? {};
            const updated = clearBelow(current, level, next);
            column.setFilterValue(
                Object.keys(updated).length ? updated : undefined,
            );
        },
        [column],
    );

    return (
        <div className="space-y-2">
            <LevelSelect
                label="Departamento"
                value={value.level1}
                options={opts.level1}
                disabled={false}
                onChange={(n) => set("level1", n)}
            />
            <LevelSelect
                label="Provincia"
                value={value.level2}
                options={opts.level2}
                disabled={!value.level1}
                onChange={(n) => set("level2", n)}
            />
            <LevelSelect
                label="Distrito"
                value={value.level3}
                options={opts.level3}
                disabled={!value.level2}
                onChange={(n) => set("level3", n)}
            />
        </div>
    );
}
