"use client";

import { useMemo } from "react";
import { summarizeGraph } from "@/core/copilot/client/context/graph-summary";
import { useCopilotUi } from "@/core/copilot/client/store";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";
import { ContractorGraph } from "@/core/finding/client/ui/contractor-graph";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/frontend/components/ui/dialog";

/**
 * The contractor network as a full-screen overlay.
 *
 * The network used to be the last section of a long page: real users never
 * scrolled to it, so neither `focusNode` nor `traceRelation` had anywhere
 * visible to land. Here the copilot can open it in one call and the user is
 * looking at the graph immediately, with no scroll involved.
 */
export function NetworkOverlay() {
    const { state, closeNetwork } = useCopilotUi();
    const watchlistId = state.selectedWatchlistId ?? undefined;
    const { data: graph } = useGraph(watchlistId);
    const { data: feed } = useFindingsFeed({ watchlistId });

    const summary = useMemo(() => {
        const flaggedFindingIds = new Set(
            (feed?.items ?? [])
                .filter((f) => f.kind === "BANDERA_ROJA")
                .map((f) => f.id),
        );
        return summarizeGraph(graph?.edges ?? [], { flaggedFindingIds });
    }, [graph, feed]);

    const scoped = state.networkFindingId
        ? (feed?.items ?? []).find((f) => f.id === state.networkFindingId)
        : null;

    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) closeNetwork();
            }}
            open={state.networkOpen}
        >
            <DialogContent className="flex h-[90svh] max-w-[min(96vw,1200px)] flex-col gap-3 p-4 sm:max-w-[min(96vw,1200px)]">
                <header className="space-y-1 pr-8">
                    <DialogTitle className="font-display text-base">
                        {scoped ? "Red del hallazgo" : "Red del frente"}
                    </DialogTitle>
                    <DialogDescription className="font-mono text-[11px]">
                        {scoped
                            ? scoped.title
                            : "Nodos = NIT · aristas = relación detectada · rojo = tocado por bandera roja"}
                    </DialogDescription>
                </header>

                <dl className="grid grid-cols-2 gap-x-5 gap-y-2 border-rule border-y py-2.5 sm:grid-cols-4">
                    <Stat label="NIT en la red" value={summary.totalNits} />
                    <Stat label="Relaciones" value={summary.totalEdges} />
                    <Stat
                        label="Nodos en bandera"
                        value={summary.nits.filter((n) => n.flagged).length}
                    />
                    <div className="leading-tight">
                        <dt className="label-ops text-muted-foreground">
                            Contraparte más conectada
                        </dt>
                        <dd className="mt-1 font-mono text-foreground text-sm tabular-nums">
                            {summary.topCounterparty
                                ? `${summary.topCounterparty.nit} · ${summary.topCounterparty.degree}`
                                : "—"}
                        </dd>
                    </div>
                </dl>

                <div className="flex min-h-0 flex-1 flex-col">
                    <ContractorGraph
                        findingId={state.networkFindingId ?? undefined}
                        heightClass="min-h-0 flex-1"
                        watchlistId={watchlistId}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="leading-tight">
            <dt className="label-ops text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-mono font-semibold text-foreground text-sm tabular-nums">
                {value}
            </dd>
        </div>
    );
}
