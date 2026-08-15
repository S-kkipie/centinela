import { z } from "zod";

export const projectStatusSchema = z.enum(["active", "archived"]);

/** Wire shape: timestamps are ISO strings (mapped from Date at the repo boundary). */
export const projectSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string().min(1),
    description: z.string().nullable(),
    status: projectStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createProjectSchema = z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: projectStatusSchema.optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: projectStatusSchema.optional(),
});

export const PROJECT_SORTABLE_COLUMNS = [
    "name",
    "status",
    "createdAt",
    "updatedAt",
] as const;

export const projectSortItemSchema = z.object({
    id: z.enum(PROJECT_SORTABLE_COLUMNS),
    desc: z.boolean(),
});

/**
 * Parses the `sort` query param for `GET /projects`. Accepts either an
 * already-parsed array (RSC callers passing a plain object) or the
 * JSON-encoded string Eden/the URL sends over the wire. `JSON.parse` is
 * wrapped so a malformed string is passed through as-is to the array schema
 * (which then fails validation) rather than throwing synchronously past
 * `.catch()` - that keeps a hand-edited/corrupt `sort` param degrading to
 * `[]` instead of a 400.
 */
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

export const projectSearchSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
        .preprocess(parseSortParam, z.array(projectSortItemSchema))
        .catch([]),
    status: z
        .preprocess(
            (v) => (v == null ? [] : Array.isArray(v) ? v : [v]),
            z.array(projectStatusSchema),
        )
        .catch([]),
    name: z.string().trim().default(""),
});

/**
 * One page of a user's projects. `pageCount`/`total` come from the server so
 * the data table can run in manual pagination mode.
 */
export const paginatedProjectsSchema = z.object({
    items: z.array(projectSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    perPage: z.number().int().min(1),
    pageCount: z.number().int().nonnegative(),
});
