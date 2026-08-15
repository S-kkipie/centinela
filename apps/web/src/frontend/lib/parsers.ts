import { createParser } from "nuqs/server";
import type { RowData } from "@tanstack/react-table";
import { z } from "zod";
import type {
    ExtendedColumnFilter,
    ExtendedColumnSort,
} from "@/frontend/types/data-table";
import { dataTableConfig } from "./data-table-config";

export const selectItemSchema = z.object({
    id: z.string(),
});

export const makeSelectItemSchema = <
    TColumns extends readonly [string, ...string[]],
>(
    columns: TColumns,
) =>
    z
        .object({
            id: z
                .enum(columns)
                .describe(
                    "The column ID to retrieve. " +
                        "ONLY select the columns you strictly need for your analysis " +
                        "to save tokens (Data economy).",
                ),
        })
        .describe(
            "Defines the specific columns to fetch. " +
                "Use this to avoid retrieving heavy or irrelevant data fields.",
        );

export const sortingItemSchema = z.object({
    id: z.string(),
    desc: z.boolean(),
});

export const makeSortingItemSchema = <
    TColumns extends readonly [string, ...string[]],
>(
    columns: TColumns,
) =>
    z
        .object({
            id: z
                .enum(columns)
                .describe(
                    "The column ID to sort by. Must be one of the valid column identifiers.",
                ),
            desc: z
                .boolean()
                .describe(
                    "Sort direction: true for descending (Z-A, newest first), false for ascending (A-Z, oldest first).",
                ),
        })
        .describe(
            "Defines a sorting rule for a data table column. Only use when the user explicitly requests sorting.",
        );

export const getSortingStateParser = <TData extends RowData>(
    columnIds?: string[] | Set<string>,
) => {
    const validKeys = columnIds
        ? columnIds instanceof Set
            ? columnIds
            : new Set(columnIds)
        : null;

    return createParser({
        parse: (value) => {
            try {
                const parsed = JSON.parse(value);
                const result = z.array(sortingItemSchema).safeParse(parsed);

                if (!result.success) return null;

                if (
                    validKeys &&
                    result.data.some((item) => !validKeys.has(item.id))
                ) {
                    return null;
                }

                return result.data as ExtendedColumnSort<TData>[];
            } catch {
                return null;
            }
        },
        serialize: (value) => JSON.stringify(value),
        eq: (a, b) =>
            a.length === b.length &&
            a.every(
                (item, index) =>
                    item.id === b[index]?.id && item.desc === b[index]?.desc,
            ),
    });
};

export const filterItemSchema = z.object({
    id: z.string(),
    value: z.union([z.string(), z.array(z.string())]),
    variant: z.enum(dataTableConfig.filterVariants),
    operator: z.enum(dataTableConfig.operators),
    filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

export const makeFilterItemSchema = <
    TColumns extends readonly [string, ...string[]],
>(
    columns: TColumns,
) =>
    z
        .object({
            id: z
                .enum(columns)
                .describe(
                    "The column ID to filter. Must be one of the valid column identifiers from the table.",
                ),
            operator: z
                .enum(dataTableConfig.operators)
                .describe(
                    "The comparison operator (e.g., 'eq', 'contains', 'gt', 'lt'). Choose based on the filter type and user intent.",
                ),
            variant: z
                .enum(dataTableConfig.filterVariants)
                .describe(
                    "The filter UI variant (e.g., 'text', 'select', 'range', 'date'). Must match the column's data type.",
                ),
            value: z
                .union([z.string().min(1), z.array(z.string().min(1))])
                .describe(
                    "The filter value. Use string for single values, array for multi-select. Must not be empty.",
                ),
            filterId: z
                .string()
                .describe(
                    "A unique identifier for this filter instance. Generate a unique ID to track this specific filter.",
                ),
        })
        .describe(
            "Defines a filter rule for a data table column. Only create when the user explicitly requests filtering data. Do NOT call without actual filter values from the user.",
        );

export const getFiltersStateParser = <TData extends RowData>(
    columnIds?: string[] | Set<string>,
) => {
    const validKeys = columnIds
        ? columnIds instanceof Set
            ? columnIds
            : new Set(columnIds)
        : null;

    return createParser({
        parse: (value) => {
            try {
                const parsed = JSON.parse(value);
                const result = z.array(filterItemSchema).safeParse(parsed);

                if (!result.success) return null;

                if (
                    validKeys &&
                    result.data.some((item) => !validKeys.has(item.id))
                ) {
                    return null;
                }

                return result.data as ExtendedColumnFilter<TData>[];
            } catch {
                return null;
            }
        },
        serialize: (value) => JSON.stringify(value),
        eq: (a, b) =>
            a.length === b.length &&
            a.every(
                (filter, index) =>
                    filter.id === b[index]?.id &&
                    filter.value === b[index]?.value &&
                    filter.variant === b[index]?.variant &&
                    filter.operator === b[index]?.operator,
            ),
    });
};
