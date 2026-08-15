"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useCopilotUi } from "@/core/copilot/client/store";
import type {
    Finding,
    Graph,
    GraphEdge,
    PaginatedFindings,
} from "@/core/finding/domain/types";
import { CompareCard } from "../ui/compare-card";
import { selectForCompare } from "../ui/compare-select";
import { tracePath } from "./graph-path";
import {
    compareOpportunitiesParams,
    focusNodeParams,
    traceRelationParams,
} from "./tool-params";

/**
 * Registers the copilot's graph tools (focusNode, traceRelation,
 * compareOpportunities). Mount once inside the copilot host — it renders
 * nothing. Reads the already-polled react-query caches (graph edges + feed
 * items) so handlers and generative renders are grounded in real data and
 * need no watchlist argument.
 */
export function useGraphTools() {
    const ui = useCopilotUi();
    const qc = useQueryClient();

    const readEdges = useCallback((): GraphEdge[] => {
        const edges: GraphEdge[] = [];
        for (const [, data] of qc.getQueriesData<Graph>({
            queryKey: ["graph"],
        })) {
            if (data?.edges) edges.push(...data.edges);
        }
        return edges;
    }, [qc]);

    const readFindings = useCallback((): Finding[] => {
        const items: Finding[] = [];
        for (const [, data] of qc.getQueriesData<PaginatedFindings>({
            queryKey: ["findings"],
        })) {
            if (data?.items) items.push(...data.items);
        }
        return items;
    }, [qc]);

    // focusNode — center/highlight one NIT on the contractor graph.
    useFrontendTool(
        {
            name: "focusNode",
            description:
                "Centra y resalta un NIT concreto en la red de contratistas. Úsalo cuando el usuario quiera ver un contratista o entidad específica.",
            parameters: focusNodeParams,
            handler: async ({ nit }) => {
                // Highlighting a node the user cannot see is not an answer:
                // put the network on screen in the same call.
                ui.openNetwork({ nit });
                ui.pushActivity({
                    kind: "copiloto",
                    text: `NIT ${nit} resaltado en la red.`,
                });
                return { focused: nit };
            },
            render: ({ args }) =>
                args.nit
                    ? `Resaltando NIT ${args.nit} en la red.`
                    : "Resaltando nodo…",
        },
        [ui],
    );

    // traceRelation — shortest relation chain between two NITs.
    useFrontendTool(
        {
            name: "traceRelation",
            description:
                "Encuentra la cadena de relaciones entre dos NITs en la red de contratistas ya cargada. Úsalo para '¿hay conexión entre X y Y?'.",
            parameters: traceRelationParams,
            handler: async ({ fromNit, toNit }) => {
                const result = tracePath(readEdges(), fromNit, toNit);
                if ("error" in result) return { error: result.error };
                // Only open the network once there is a chain to look at.
                ui.openNetwork({ nit: fromNit });
                ui.pushActivity({
                    kind: "copiloto",
                    text: `Cadena trazada entre ${fromNit} y ${toNit}: ${result.path.length} ${result.path.length === 1 ? "relación" : "relaciones"}.`,
                });
                return {
                    hops: result.path.length,
                    path: result.path.map((e) => ({
                        fromNit: e.fromNit,
                        relation: e.relation,
                        toNit: e.toNit,
                    })),
                };
            },
            render: ({ args }) => {
                if (!args.fromNit || !args.toNit) return "Trazando conexión…";
                const result = tracePath(readEdges(), args.fromNit, args.toNit);
                if ("error" in result)
                    return (
                        <p className="label-ops text-flag">
                            Sin conexión entre {args.fromNit} y {args.toNit}.
                        </p>
                    );
                return (
                    <section className="space-y-1.5 rounded-md border border-rule bg-background p-3">
                        <header className="label-ops text-muted-foreground">
                            Cadena de {result.path.length}{" "}
                            {result.path.length === 1
                                ? "relación"
                                : "relaciones"}
                        </header>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px]">
                            <span className="rounded-sm bg-signal-soft px-1.5 py-0.5 text-signal">
                                {args.fromNit}
                            </span>
                            {result.path.map((e) => {
                                const next =
                                    e.fromNit === args.fromNit
                                        ? e.toNit
                                        : e.fromNit;
                                return (
                                    <span
                                        className="flex items-center gap-2"
                                        key={e.id}
                                    >
                                        <span className="text-muted-foreground uppercase tracking-wide">
                                            →({e.relation})→
                                        </span>
                                        <span className="rounded-sm bg-signal-soft px-1.5 py-0.5 text-signal">
                                            {next}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </section>
                );
            },
        },
        [ui, readEdges],
    );

    // compareOpportunities — 2–3 OPORTUNIDAD findings side by side.
    useFrontendTool(
        {
            name: "compareOpportunities",
            description:
                "Compara 2 o 3 hallazgos de tipo OPORTUNIDAD lado a lado (entidad, score, cuantía, resumen). Úsalo para 'compara estas oportunidades'.",
            parameters: compareOpportunitiesParams,
            handler: async ({ findingIds }) => {
                const selected = selectForCompare(readFindings(), findingIds);
                if (selected.length < 2)
                    return {
                        error: "no encontré al menos dos oportunidades para comparar",
                    };
                return { comparing: selected.map((f) => f.id) };
            },
            render: ({ args }) => {
                const ids = args.findingIds ?? [];
                if (ids.length < 2) return "Preparando comparación…";
                const selected = selectForCompare(readFindings(), ids);
                return <CompareCard findings={selected} />;
            },
        },
        [readFindings],
    );

    return null;
}
