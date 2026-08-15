"use client";

import {
    Background,
    Controls,
    type Edge,
    type Node,
    ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { useGraph } from "@/core/finding/client/hooks";
import type { GraphEdge } from "@/core/finding/domain/types";
import { Spinner } from "@/frontend/components/ui/spinner";

/**
 * Build a radial-ish node/edge layout from graph edges. Nodes are NITs (deduped
 * across findings, per contract), positioned on a circle so the network reads
 * at a glance without a heavyweight layout engine.
 */
function toFlow(edges: GraphEdge[]): { nodes: Node[]; edges: Edge[] } {
    const nitSet = new Set<string>();
    for (const e of edges) {
        nitSet.add(e.fromNit);
        nitSet.add(e.toNit);
    }
    const nits = [...nitSet];
    const radius = Math.max(160, nits.length * 40);
    const nodes: Node[] = nits.map((nit, i) => {
        const angle = (2 * Math.PI * i) / Math.max(nits.length, 1);
        return {
            id: nit,
            position: {
                x: radius + radius * Math.cos(angle),
                y: radius + radius * Math.sin(angle),
            },
            data: { label: nit },
            style: {
                borderRadius: 8,
                border: "1px solid var(--border)",
                padding: 8,
                fontSize: 12,
            },
        };
    });
    const flowEdges: Edge[] = edges.map((e, i) => ({
        id: e.id || `edge-${i}`,
        source: e.fromNit,
        target: e.toNit,
        label: e.relation,
        animated: true,
    }));
    return { nodes, edges: flowEdges };
}

export function ContractorGraph({ watchlistId }: { watchlistId?: string }) {
    const { data, isLoading } = useGraph(watchlistId);
    const flow = useMemo(() => toFlow(data?.edges ?? []), [data]);

    if (!watchlistId)
        return (
            <p className="text-muted-foreground text-sm">
                Selecciona una watchlist para ver la red de contratistas.
            </p>
        );
    if (isLoading)
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Spinner /> Cargando grafo…
            </div>
        );
    if (flow.nodes.length === 0)
        return (
            <p className="text-muted-foreground text-sm">
                Sin relaciones todavía. Aparecerán cuando el agente cruce datos.
            </p>
        );

    return (
        <div className="h-[480px] w-full rounded-lg border">
            <ReactFlow edges={flow.edges} fitView nodes={flow.nodes}>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
