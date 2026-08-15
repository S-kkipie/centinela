/**
 * Condenses the contractor network into something small enough to sit in the
 * copilot's prompt. Without this the copilot has no idea the graph exists and
 * can only offer to highlight a NIT it was handed.
 */

type EdgeLike = {
    fromNit: string;
    toNit: string;
    relation: string;
    findingId?: string | null;
};

export type GraphNitSummary = {
    nit: string;
    name?: string;
    degree: number;
    flagged: boolean;
    /** True for the contracting entity the user watches — the hub by design. */
    watched: boolean;
};

export type GraphSummary = {
    totalNits: number;
    totalEdges: number;
    relations: Record<string, number>;
    nits: GraphNitSummary[];
    /** Most-connected NIT that is NOT the watched entity — the real signal. */
    topCounterparty: GraphNitSummary | null;
    edges: { from: string; to: string; relation: string; flagged: boolean }[];
    truncated: boolean;
};

const MAX_EDGES = 60;
const MAX_NITS = 40;

export function summarizeGraph(
    edges: EdgeLike[],
    opts: {
        flaggedFindingIds: Set<string>;
        entityNames?: Record<string, string>;
    },
): GraphSummary {
    const { flaggedFindingIds, entityNames = {} } = opts;

    const degree = new Map<string, number>();
    const flagged = new Set<string>();
    const relations: Record<string, number> = {};

    for (const e of edges) {
        degree.set(e.fromNit, (degree.get(e.fromNit) ?? 0) + 1);
        degree.set(e.toNit, (degree.get(e.toNit) ?? 0) + 1);
        relations[e.relation] = (relations[e.relation] ?? 0) + 1;
        if (e.findingId && flaggedFindingIds.has(e.findingId)) {
            flagged.add(e.fromNit);
            flagged.add(e.toNit);
        }
    }

    const nits: GraphNitSummary[] = [...degree.entries()]
        .map(([nit, d]) => ({
            nit,
            ...(entityNames[nit] ? { name: entityNames[nit] } : {}),
            degree: d,
            flagged: flagged.has(nit),
            watched: nit in entityNames,
        }))
        // Ties are common (a two-edge chain), so break them deterministically:
        // named entities first — they anchor the network the user is watching.
        .sort(
            (a, b) =>
                b.degree - a.degree ||
                (a.name ? 0 : 1) - (b.name ? 0 : 1) ||
                a.nit.localeCompare(b.nit),
        )
        .slice(0, MAX_NITS);

    return {
        totalNits: degree.size,
        totalEdges: edges.length,
        relations,
        nits,
        topCounterparty: nits.find((n) => !n.watched) ?? null,
        edges: edges.slice(0, MAX_EDGES).map((e) => ({
            from: e.fromNit,
            to: e.toNit,
            relation: e.relation,
            flagged: Boolean(e.findingId && flaggedFindingIds.has(e.findingId)),
        })),
        truncated: edges.length > MAX_EDGES,
    };
}
