import { FINDING_KINDS } from "@centinela/contracts/finding";
import { z } from "zod";

export const findingKindSchema = z.enum(FINDING_KINDS);

export const findingEvidenceSchema = z.object({
    source: z.string().min(1),
    url: z.string().optional(),
    claim: z.string().min(1),
});

/** Wire shape: timestamps ISO strings; `raw` is not exposed to clients. */
export const findingSchema = z.object({
    id: z.string(),
    watchlistId: z.string(),
    tenderId: z.string(),
    entityId: z.string(),
    entityName: z.string(),
    kind: findingKindSchema,
    score: z.number().int().min(0).max(100),
    title: z.string(),
    summary: z.string(),
    evidence: z.array(findingEvidenceSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const FINDING_SORTABLE_COLUMNS = ["score", "createdAt"] as const;

export const findingSortItemSchema = z.object({
    id: z.enum(FINDING_SORTABLE_COLUMNS),
    desc: z.boolean(),
});

function parseSortParam(value: unknown): unknown {
    if (typeof value === "string" && value) {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    return value ?? [];
}

export const findingSearchSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
        .preprocess(parseSortParam, z.array(findingSortItemSchema))
        .catch([]),
    kind: z
        .preprocess(
            (v) => (v == null ? [] : Array.isArray(v) ? v : [v]),
            z.array(findingKindSchema),
        )
        .catch([]),
    watchlistId: z.string().trim().default(""),
});

export const paginatedFindingsSchema = z.object({
    items: z.array(findingSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    perPage: z.number().int().min(1),
    pageCount: z.number().int().nonnegative(),
});

export const graphEdgeSchema = z.object({
    id: z.string(),
    watchlistId: z.string(),
    findingId: z.string().nullable(),
    fromNit: z.string(),
    toNit: z.string(),
    relation: z.string(),
    createdAt: z.string(),
});

export const graphSchema = z.object({
    edges: z.array(graphEdgeSchema),
});
