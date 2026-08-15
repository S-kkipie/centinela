"use client";

import { MaximizeIcon } from "lucide-react";
import { useMemo } from "react";
import { summarizeGraph } from "@/core/copilot/client/context/graph-summary";
import { useCopilotUiOptional } from "@/core/copilot/client/store";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";

/**
 * The network, reduced to the line that makes someone want to see it.
 *
 * The full graph used to sit here as a 480px canvas at the bottom of the page —
 * the part of the console nobody scrolled to. Now this strip states what the
 * network contains and opens it as an overlay, so the graph is one click from
 * anywhere instead of a scroll away.
 */
export function NetworkTeaser({ watchlistId }: { watchlistId?: string }) {
    const { data: graph } = useGraph(watchlistId);
    const { data: feed } = useFindingsFeed({ watchlistId });
    const copilot = useCopilotUiOptional();

    const summary = useMemo(() => {
        const flaggedFindingIds = new Set(
            (feed?.items ?? [])
                .filter((f) => f.kind === "BANDERA_ROJA")
                .map((f) => f.id),
        );
        return summarizeGraph(graph?.edges ?? [], { flaggedFindingIds });
    }, [graph, feed]);

    if (!watchlistId)
        return (
            <p className="rounded-lg border border-rule border-dashed bg-card px-3.5 py-3 text-muted-foreground text-sm">
                Selecciona un frente para ver su red de contratistas.
            </p>
        );

    const flaggedNodes = summary.nits.filter((n) => n.flagged).length;
    const empty = summary.totalEdges === 0;

    return (
        <section
            className="overflow-hidden rounded-lg border border-rule bg-card"
            data-reveal="red"
        >
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-3.5 py-3">
                <div className="min-w-0 space-y-1">
                    <p className="label-ops text-muted-foreground">
                        Red del frente
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                        {empty
                            ? "Sin relaciones todavía. Aparecerán cuando el agente cruce datos."
                            : `${summary.totalNits} NIT · ${summary.totalEdges} relaciones · ${flaggedNodes} en bandera roja`}
                    </p>
                    {!empty && summary.topCounterparty && (
                        <p className="font-mono text-[11px] text-muted-foreground">
                            Contraparte más conectada:{" "}
                            <span className="text-foreground">
                                {summary.topCounterparty.nit}
                            </span>{" "}
                            ({summary.topCounterparty.degree} vínculos)
                        </p>
                    )}
                </div>
                <button
                    className="flex shrink-0 items-center gap-1.5 rounded-sm border border-rule px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-signal/60 hover:text-signal disabled:opacity-60 disabled:hover:border-rule disabled:hover:text-muted-foreground"
                    disabled={empty}
                    onClick={() => copilot?.openNetwork()}
                    type="button"
                >
                    <MaximizeIcon className="size-3" />
                    <span className="label-ops">Abrir la red</span>
                </button>
            </div>
        </section>
    );
}
