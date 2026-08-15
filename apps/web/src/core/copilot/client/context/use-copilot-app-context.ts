"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useCopilotUi } from "@/core/copilot/client/store";
import { useFindingsFeed } from "@/core/finding/client/hooks";
import { useWatchlists } from "@/core/watchlist/client/hooks";

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
            "Estado de UI que el copiloto ya impuso: filtro activo del inbox, hallazgo enfocado y NIT resaltado en el grafo (null = ninguno)",
        value: state,
    });
}
