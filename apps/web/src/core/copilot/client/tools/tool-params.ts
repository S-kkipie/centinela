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

/** Open the contractor network overlay, optionally centred and/or scoped. */
export const openNetworkParams = z.object({
    nit: z
        .string()
        .min(1)
        .optional()
        .describe("NIT a centrar y resaltar al abrir la red"),
    findingId: z
        .string()
        .min(1)
        .optional()
        .describe("Acota la red a las relaciones de ese hallazgo"),
});

/** Award-concentration scan over the network currently on screen. */
export const patternScanParams = z.object({
    entityQuery: z
        .string()
        .min(1)
        .optional()
        .describe(
            "Nombre o fragmento del frente a analizar; por defecto, el que está en pantalla",
        ),
});

/** Any of the four documents the copilot can hand over. */
export const draftDocumentParams = z.object({
    findingId: z
        .string()
        .min(1)
        .optional()
        .describe(
            "Id del hallazgo, o fragmento de su título; por defecto el hallazgo abierto",
        ),
});

/** The petition draft additionally accepts who signs it. */
export const draftDenunciaParams = draftDocumentParams.extend({
    requesterName: z
        .string()
        .min(1)
        .optional()
        .describe("Nombre del peticionario, si el usuario lo dio"),
});

export type OpenNetworkParams = z.infer<typeof openNetworkParams>;
export type PatternScanParams = z.infer<typeof patternScanParams>;
export type DraftDocumentParams = z.infer<typeof draftDocumentParams>;
export type FocusNodeParams = z.infer<typeof focusNodeParams>;
export type TraceRelationParams = z.infer<typeof traceRelationParams>;
export type CompareOpportunitiesParams = z.infer<
    typeof compareOpportunitiesParams
>;
