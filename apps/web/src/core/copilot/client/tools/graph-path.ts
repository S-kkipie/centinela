import type { GraphEdge } from "@/core/finding/domain/types";

export type TraceResult = { path: GraphEdge[] } | { error: string };

const NO_PATH: TraceResult = { error: "sin conexión encontrada" };

/**
 * Shortest chain of edges between two NITs over the already-polled graph.
 * The contractor graph is undirected for tracing — a `socio`/`contrato` edge
 * connects both ways — so BFS walks edges in either orientation and returns
 * the edges along the shortest hop path. Same NIT, missing NIT, or separate
 * components all yield "sin conexión encontrada".
 */
export function tracePath(
    edges: GraphEdge[],
    fromNit: string,
    toNit: string,
): TraceResult {
    if (fromNit === toNit) return NO_PATH;

    const adjacency = new Map<string, GraphEdge[]>();
    const link = (nit: string, edge: GraphEdge) => {
        const list = adjacency.get(nit);
        if (list) list.push(edge);
        else adjacency.set(nit, [edge]);
    };
    for (const edge of edges) {
        link(edge.fromNit, edge);
        link(edge.toNit, edge);
    }
    if (!adjacency.has(fromNit) || !adjacency.has(toNit)) return NO_PATH;

    // BFS; `cameFrom` records the edge used to first reach each NIT.
    const cameFrom = new Map<string, GraphEdge>();
    const visited = new Set<string>([fromNit]);
    const queue: string[] = [fromNit];

    while (queue.length > 0) {
        const current = queue.shift() as string;
        if (current === toNit) break;
        for (const edge of adjacency.get(current) ?? []) {
            const next = edge.fromNit === current ? edge.toNit : edge.fromNit;
            if (visited.has(next)) continue;
            visited.add(next);
            cameFrom.set(next, edge);
            queue.push(next);
        }
    }

    if (!cameFrom.has(toNit)) return NO_PATH;

    const path: GraphEdge[] = [];
    let node = toNit;
    while (node !== fromNit) {
        const edge = cameFrom.get(node);
        if (!edge) return NO_PATH;
        path.unshift(edge);
        node = edge.fromNit === node ? edge.toNit : edge.fromNit;
    }
    return { path };
}
