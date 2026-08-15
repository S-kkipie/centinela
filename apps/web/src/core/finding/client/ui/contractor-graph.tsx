"use client";

import { Controls, type Edge, type Node, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";
import type { GraphEdge } from "@/core/finding/domain/types";
import { Spinner } from "@/frontend/components/ui/spinner";
import { cn } from "@/frontend/lib/utils";

/** Recolor React Flow chrome (controls, attribution) to intel tokens. */
const flowTheme = {
    "--xy-controls-button-background-color": "var(--color-panel)",
    "--xy-controls-button-background-color-hover": "var(--color-paper-2)",
    "--xy-controls-button-color": "var(--color-ink)",
    "--xy-controls-button-color-hover": "var(--color-ink)",
    "--xy-controls-button-border-color": "var(--color-rule)",
    "--xy-attribution-background-color": "transparent",
} as CSSProperties;

const nodeStyle = (flagged: boolean): CSSProperties => ({
    background: "var(--color-panel)",
    border: `1px solid ${flagged ? "var(--color-flag)" : "var(--color-accent-signal)"}`,
    borderRadius: 4,
    color: flagged ? "var(--color-flag)" : "var(--color-ink)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.04em",
    padding: 6,
});

/**
 * Build a radial-ish node/edge layout from graph edges. Nodes are NITs (deduped
 * across findings, per contract), positioned on a circle so the network reads
 * at a glance without a heavyweight layout engine.
 */
function toFlow(
    edges: GraphEdge[],
    flaggedFindingIds: Set<string>,
): { nodes: Node[]; edges: Edge[] } {
    const nitSet = new Set<string>();
    const flaggedNits = new Set<string>();
    for (const e of edges) {
        nitSet.add(e.fromNit);
        nitSet.add(e.toNit);
        if (e.findingId && flaggedFindingIds.has(e.findingId)) {
            flaggedNits.add(e.fromNit);
            flaggedNits.add(e.toNit);
        }
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
            style: nodeStyle(flaggedNits.has(nit)),
        };
    });
    const flowEdges: Edge[] = edges.map((e, i) => {
        const flagged = Boolean(
            e.findingId && flaggedFindingIds.has(e.findingId),
        );
        return {
            id: e.id || `edge-${i}`,
            source: e.fromNit,
            target: e.toNit,
            label: e.relation,
            animated: true,
            style: {
                stroke: flagged ? "var(--color-flag)" : "var(--color-rule)",
                strokeWidth: 1.25,
            },
            labelStyle: {
                fill: flagged ? "var(--color-flag)" : "var(--color-muted-ink)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
            },
            labelBgStyle: { fill: "var(--color-panel)", fillOpacity: 0.9 },
        };
    });
    return { nodes, edges: flowEdges };
}

export function ContractorGraph({
    watchlistId,
    findingId,
}: {
    watchlistId?: string;
    /** Si se pasa, la red se acota a las relaciones de ese hallazgo. */
    findingId?: string;
}) {
    const { data, isLoading } = useGraph(watchlistId);
    // Shares the feed's react-query cache; used to flag BANDERA_ROJA relations.
    const { data: feed } = useFindingsFeed({ watchlistId });

    const flaggedFindingIds = useMemo(
        () =>
            new Set(
                (feed?.items ?? [])
                    .filter((f) => f.kind === "BANDERA_ROJA")
                    .map((f) => f.id),
            ),
        [feed],
    );
    const flow = useMemo(() => {
        const edges = (data?.edges ?? []).filter(
            (e) => !findingId || e.findingId === findingId,
        );
        return toFlow(edges, flaggedFindingIds);
    }, [data, flaggedFindingIds, findingId]);

    if (!watchlistId)
        return (
            <p className="text-muted-foreground text-sm">
                Selecciona una vigilada para ver la red de contratistas.
            </p>
        );
    if (isLoading)
        return (
            <div className="label-ops flex items-center gap-2 text-muted-foreground">
                <Spinner className="size-3.5" /> Cargando grafo…
            </div>
        );
    if (flow.nodes.length === 0)
        return (
            <p className="rounded-md border border-rule border-dashed bg-background px-3 py-3 text-muted-foreground text-sm">
                {findingId
                    ? "Este hallazgo no registró relaciones entre NITs."
                    : "Sin relaciones todavía. Aparecerán cuando el agente cruce datos."}
            </p>
        );

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    "bg-grid-ops w-full overflow-hidden rounded-md border border-rule bg-panel",
                    findingId ? "h-[320px]" : "h-[480px]",
                )}
                style={flowTheme}
            >
                <ReactFlow edges={flow.edges} fitView nodes={flow.nodes}>
                    <Controls showInteractive={false} />
                </ReactFlow>
            </div>
            <p className="label-ops flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-signal"
                    />
                    NIT sin alerta
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-flag"
                    />
                    NIT en bandera roja
                </span>
            </p>
        </div>
    );
}
