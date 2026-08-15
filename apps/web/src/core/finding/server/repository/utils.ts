import type { Finding, GraphEdge } from "@/core/finding/domain/types";
import type {
    FindingRow,
    GraphEdgeRow,
} from "@/server/drizzle/schemas/finding-schema";

/** Convert a finding DB row into the wire shape (ISO strings, `raw` dropped). */
export function toFinding(row: FindingRow): Finding {
    return {
        id: row.id,
        watchlistId: row.watchlistId,
        tenderId: row.tenderId,
        entityId: row.entityId,
        entityName: row.entityName,
        kind: row.kind,
        score: row.score,
        title: row.title,
        summary: row.summary,
        evidence: row.evidence,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function toGraphEdge(row: GraphEdgeRow): GraphEdge {
    return {
        id: row.id,
        watchlistId: row.watchlistId,
        findingId: row.findingId,
        fromNit: row.fromNit,
        toNit: row.toNit,
        relation: row.relation,
        createdAt: row.createdAt.toISOString(),
    };
}
