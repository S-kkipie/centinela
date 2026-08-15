import type { z } from "zod";
import type {
    findingEvidenceSchema,
    findingKindSchema,
    findingSchema,
    findingSearchSchema,
    findingSortItemSchema,
    graphEdgeSchema,
    graphSchema,
    paginatedFindingsSchema,
} from "./schemas";

export type FindingKind = z.infer<typeof findingKindSchema>;
export type FindingEvidence = z.infer<typeof findingEvidenceSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type FindingSort = z.infer<typeof findingSortItemSchema>;
export type FindingSearch = z.infer<typeof findingSearchSchema>;
export type PaginatedFindings = z.infer<typeof paginatedFindingsSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type Graph = z.infer<typeof graphSchema>;
