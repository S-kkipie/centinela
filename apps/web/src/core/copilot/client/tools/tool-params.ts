import { z } from "zod";

/** Center/highlight one NIT on the contractor graph. */
export const focusNodeParams = z.object({
    nit: z.string().min(1),
});

/** Trace the relation chain between two NITs on the graph. */
export const traceRelationParams = z.object({
    fromNit: z.string().min(1),
    toNit: z.string().min(1),
});

/** Compare 2–3 OPORTUNIDAD findings side by side. */
export const compareOpportunitiesParams = z.object({
    findingIds: z.array(z.string().min(1)).min(2).max(3),
});

export type FocusNodeParams = z.infer<typeof focusNodeParams>;
export type TraceRelationParams = z.infer<typeof traceRelationParams>;
export type CompareOpportunitiesParams = z.infer<
    typeof compareOpportunitiesParams
>;
