/**
 * Pure logic behind the finding tools — kept .ts (no React) so vitest's
 * node-environment suite covers it directly.
 */

import { z } from "zod";
import type { FindingFilter } from "@/core/copilot/client/store";
import { findingKindSchema } from "@/core/finding/domain/schemas";

export const filterFindingsParams = z.object({
    kind: findingKindSchema.optional(),
    watchlistId: z.string().optional(),
    entityQuery: z.string().optional(),
    sinceDays: z.number().int().positive().optional(),
});
export type FilterFindingsParams = z.infer<typeof filterFindingsParams>;

export const openFindingParams = z.object({
    findingId: z.string().min(1),
});

export const explainFindingParams = z.object({
    findingId: z
        .string()
        .min(1)
        .describe("Finding id, or a title/entity fragment if the id is unknown"),
});

/** Empty params mean "clear the override" → null. */
export function toFindingFilter(
    params: FilterFindingsParams,
): FindingFilter | null {
    const filter: FindingFilter = {};
    if (params.kind) filter.kind = params.kind;
    if (params.watchlistId) filter.watchlistId = params.watchlistId;
    if (params.entityQuery) filter.entityQuery = params.entityQuery;
    if (params.sinceDays != null) filter.sinceDays = params.sinceDays;
    return Object.keys(filter).length > 0 ? filter : null;
}

type ResolvableFinding = {
    id: string;
    entityName: string;
    title: string;
};

/** Exact id first; else case-insensitive substring over title/entityName. */
export function resolveFinding<T extends ResolvableFinding>(
    items: T[],
    idOrQuery: string,
): T | undefined {
    const byId = items.find((f) => f.id === idOrQuery);
    if (byId) return byId;
    const q = idOrQuery.toLowerCase();
    return items.find(
        (f) =>
            f.title.toLowerCase().includes(q) ||
            f.entityName.toLowerCase().includes(q),
    );
}
