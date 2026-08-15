"use client";

import {
    Controls,
    type Edge,
    type Node,
    ReactFlow,
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CSSProperties } from "react";
import { useEffect, useMemo } from "react";
import { useCopilotUiOptional } from "@/core/copilot/client/store";
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

const nodeStyle = (flagged: boolean, focused: boolean): CSSProperties => ({
    background: focused ? "var(--color-paper-2)" : "var(--color-panel)",
    border: `${focused ? 2 : 1}px solid ${flagged ? "var(--color-flag)" : "var(--color-accent-signal)"}`,
    borderRadius: 4,
    boxShadow: focused
        ? "0 0 0 3px color-mix(in srgb, var(--color-accent-signal) 35%, transparent)"
        : undefined,
    color: flagged ? "var(--color-flag)" : "var(--color-ink)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.04em",
    opacity: focused ? 1 : undefined,
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
    focusNit: string | null,
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
            style: nodeStyle(flaggedNits.has(nit), nit === focusNit),
        };
    });
    const flowEdges: Edge[] = edges.map((e, i) => {
        const flagged = Boolean(
            e.findingId && flaggedFindingIds.has(e.findingId),
        );
        const touchesFocus =
            focusNit != null &&
            (e.fromNit === focusNit || e.toNit === focusNit);
        return {
            id: e.id || `edge-${i}`,
            source: e.fromNit,
            target: e.toNit,
            label: e.relation,
            animated: true,
            style: {
                stroke: touchesFocus
                    ? "var(--color-accent-signal)"
                    : flagged
                      ? "var(--color-flag)"
                      : "var(--color-rule)",
                strokeWidth: touchesFocus ? 2 : 1.25,
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

/**
 * Pans/zooms to the copilot-focused NIT once its node exists. Lives inside
 * <ReactFlow> so it can use the flow instance; renders nothing.
 */
function FocusController({ focusNit }: { focusNit: string | null }) {
    const flow = useReactFlow();
    useEffect(() => {
        if (!focusNit) return;
        const node = flow.getNode(focusNit);
        if (!node) return;
        flow.setCenter(
            node.position.x + (node.measured?.width ?? 0) / 2,
            node.position.y + (node.measured?.height ?? 0) / 2,
            { zoom: 1.4, duration: 600 },
        );
    }, [focusNit, flow]);
    return null;
}

export function ContractorGraph({
    watchlistId,
    findingId,
    heightClass,
}: {
    watchlistId?: string;
    /** Si se pasa, la red se acota a las relaciones de ese hallazgo. */
    findingId?: string;
    /** Alto del lienzo; por defecto el inline. El overlay lo llena todo. */
    heightClass?: string;
}) {
    const { data, isLoading } = useGraph(watchlistId);
    // Shares the feed's react-query cache; used to flag BANDERA_ROJA relations.
    const { data: feed } = useFindingsFeed({ watchlistId });
    // Copilot-driven focus; null (or no provider) = no highlight.
    const copilotUi = useCopilotUiOptional();
    const focusNit = copilotUi?.state.focusNit ?? null;

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
        return toFlow(edges, flaggedFindingIds, focusNit);
    }, [data, flaggedFindingIds, findingId, focusNit]);

    if (!watchlistId)
        return (
            <p className="text-muted-foreground text-sm">
                Selecciona un frente para ver la red de contratistas.
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
        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div
                className={cn(
                    "bg-grid-ops w-full overflow-hidden rounded-md border border-rule bg-panel",
                    heightClass ?? (findingId ? "h-[320px]" : "h-[480px]"),
                )}
                style={flowTheme}
            >
                <ReactFlow edges={flow.edges} fitView nodes={flow.nodes}>
                    <Controls showInteractive={false} />
                    <FocusController focusNit={focusNit} />
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
