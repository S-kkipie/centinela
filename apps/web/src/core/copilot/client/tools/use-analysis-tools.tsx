"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useCallback } from "react";
import {
    analyzeConcentration,
    describeConcentration,
} from "@/core/copilot/client/analysis/concentration";
import { useCopilotUi } from "@/core/copilot/client/store";
import { patternScanParams } from "@/core/copilot/client/tools/tool-params";
import { PatternCard } from "@/core/copilot/client/ui/pattern-card";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";
import { useWatchlist, useWatchlists } from "@/core/watchlist/client/hooks";

/**
 * `patternScan` — award concentration over the network on screen.
 *
 * The single most damning pattern in public procurement ("this entity awarded
 * 7 of 9 contracts to the same NIT", "these two bidders share a legal
 * representative") is invisible in a list of individual findings, and no tool
 * computed it. It runs entirely off the already-polled graph, so it is instant
 * and grounded.
 */
export function useAnalysisTools() {
    const ui = useCopilotUi();
    const { state, pushActivity } = ui;
    const watchlistId = state.selectedWatchlistId ?? undefined;
    const { data: graph } = useGraph(watchlistId);
    const { data: feed } = useFindingsFeed({ watchlistId });
    const { data: watchlist } = useWatchlist(watchlistId);
    const { data: watchlists } = useWatchlists();

    const scan = useCallback(() => {
        const flaggedFindingIds = new Set(
            (feed?.items ?? [])
                .filter((f) => f.kind === "BANDERA_ROJA")
                .map((f) => f.id),
        );
        const watchedNits = new Set(
            (watchlist?.entities ?? []).map((e) => e.nit),
        );
        return analyzeConcentration(graph?.edges ?? [], {
            watchedNits,
            flaggedFindingIds,
        });
    }, [graph, feed, watchlist]);

    const label =
        watchlist?.name ??
        (watchlists ?? []).find((w) => w.id === watchlistId)?.name ??
        undefined;

    useFrontendTool(
        {
            name: "patternScan",
            description:
                "Analiza la concentración de adjudicaciones del frente en pantalla: cuántos contratos se lleva cada NIT, qué tan concentrado está el reparto (índice HHI) y si dos adjudicatarios distintos comparten representante legal. Úsalo para '¿hay un patrón?', '¿siempre gana el mismo?', '¿esto está amañado?' o cuando quieras respaldar una bandera roja con el comportamiento histórico de la entidad.",
            parameters: patternScanParams,
            handler: async () => {
                const report = scan();
                pushActivity({
                    kind: report.notable ? "bandera" : "copiloto",
                    text: `Patrón: ${describeConcentration(report)}`,
                });
                return {
                    entity: label ?? null,
                    totalAwards: report.totalAwards,
                    distinctWinners: report.distinctWinners,
                    hhi: Number(report.hhi.toFixed(3)),
                    notable: report.notable,
                    top: report.top,
                    sharedRepresentatives: report.sharedRepresentatives,
                    verdict: describeConcentration(report),
                };
            },
            render: () => <PatternCard entityLabel={label} report={scan()} />,
        },
        [scan, label, pushActivity],
    );
}
