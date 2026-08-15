"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { summarizeGraph } from "@/core/copilot/client/context/graph-summary";
import { useCopilotUi } from "@/core/copilot/client/store";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";
import { useWatchlist, useWatchlists } from "@/core/watchlist/client/hooks";

/**
 * Feeds the copilot a compact digest of app state so "este proceso" or
 * "mis vigiladas" resolve without the user repeating ids. Evidence bodies
 * stay out — explainFinding fetches those on demand.
 */
export function useCopilotAppContext() {
    const { data: watchlists } = useWatchlists();
    const { data: feed } = useFindingsFeed();
    const { state } = useCopilotUi();

    useAgentContext({
        description:
            "Vigiladas (watchlists) del usuario: entidades contratantes que el agente barre cada 2 horas",
        value: (watchlists ?? []).map((w) => ({ id: w.id, name: w.name })),
    });

    useAgentContext({
        description:
            "Hallazgos visibles en el Panel (digest): id, título, entidad, tipo (OPORTUNIDAD ganable | BANDERA_ROJA riesgo), score 0-100 y fecha",
        value: (feed?.items ?? []).map((f) => ({
            id: f.id,
            title: f.title,
            entityName: f.entityName,
            kind: f.kind,
            score: f.score,
            createdAt: f.createdAt,
        })),
    });

    useAgentContext({
        description:
            "Estado de UI: vigilada seleccionada en el Panel, filtro activo del inbox, hallazgo enfocado y NIT resaltado en el grafo (null = ninguno)",
        value: state,
    });

    // Contractor network of the watchlist on screen, condensed for the prompt.
    const { data: graph } = useGraph(state.selectedWatchlistId ?? undefined);
    const { data: selectedWatchlist } = useWatchlist(
        state.selectedWatchlistId ?? undefined,
    );
    const graphSummary = useMemo(() => {
        const flaggedFindingIds = new Set(
            (feed?.items ?? [])
                .filter((f) => f.kind === "BANDERA_ROJA")
                .map((f) => f.id),
        );
        const entityNames: Record<string, string> = {};
        for (const e of selectedWatchlist?.entities ?? []) {
            entityNames[e.nit] = e.name;
        }
        return summarizeGraph(graph?.edges ?? [], {
            flaggedFindingIds,
            entityNames,
        });
    }, [graph, feed, selectedWatchlist]);

    useAgentContext({
        description:
            "Red de contratistas de la vigilada seleccionada (el grafo que el usuario ve en 'Red general de contratistas'). Nodos = NIT; aristas = relación detectada entre dos NIT (adjudicatario: ganó un contrato de esa entidad; representante_legal: persona que representa a esa empresa). flagged = tocado por una BANDERA_ROJA. degree = número de conexiones. watched=true marca la ENTIDAD VIGILADA: es el centro de la red por construcción (toda adjudicación suya la toca), así que su degree alto NO es señal de nada. La concentración que importa se juzga entre contrapartes: topCounterparty es la más conectada que no es la entidad vigilada.",
        value: graphSummary,
    });
}
