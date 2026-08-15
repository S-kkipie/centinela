"use client";

import { ArrowRightIcon } from "lucide-react";
import { useMemo } from "react";
import { analyzeConcentration } from "@/core/copilot/client/analysis/concentration";
import { topRedFlag } from "@/core/copilot/client/autonomy/briefing";
import { useCopilotUiOptional } from "@/core/copilot/client/store";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";
import type { Finding } from "@/core/finding/domain/types";
import { useWatchlist } from "@/core/watchlist/client/hooks";
import { cn } from "@/frontend/lib/utils";

/**
 * Triage: the three things worth acting on, at eye level.
 *
 * The console opened on a header of counters and a list — true, but not a
 * decision. These cards answer "what do I do now": the worst flag, the best
 * opportunity, and the shape of the network, each one click from the thing
 * itself.
 */
export function TriageRow({ watchlistId }: { watchlistId?: string }) {
    const { data: feed } = useFindingsFeed({ watchlistId });
    const { data: graph } = useGraph(watchlistId);
    const { data: watchlist } = useWatchlist(watchlistId);
    const copilot = useCopilotUiOptional();

    const items = feed?.items ?? [];

    const worstFlag = useMemo(() => topRedFlag(items), [items]);
    const bestOpportunity = useMemo(
        () =>
            items
                .filter((f) => f.kind === "OPORTUNIDAD")
                .reduce<Finding | null>(
                    (best, f) => (!best || f.score > best.score ? f : best),
                    null,
                ),
        [items],
    );
    const concentration = useMemo(() => {
        const flaggedFindingIds = new Set(
            items.filter((f) => f.kind === "BANDERA_ROJA").map((f) => f.id),
        );
        const watchedNits = new Set(
            (watchlist?.entities ?? []).map((e) => e.nit),
        );
        return analyzeConcentration(graph?.edges ?? [], {
            watchedNits,
            flaggedFindingIds,
        });
    }, [graph, items, watchlist]);

    if (items.length === 0) return null;

    const openReport = (finding: Finding) => {
        copilot?.focusFinding(finding.id);
        copilot?.reveal("informe", `Informe de "${finding.title}"`);
    };

    const leader = concentration.top[0];
    const shared = concentration.sharedRepresentatives[0];

    return (
        <section
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            data-reveal="triage"
        >
            <TriageCard
                accent={worstFlag ? "flag" : "muted"}
                detail={
                    worstFlag
                        ? `${worstFlag.entityName} · score ${worstFlag.score}`
                        : "El agente no ha marcado riesgos en este frente."
                }
                disabled={!worstFlag}
                headline={worstFlag ? worstFlag.title : "Sin banderas rojas"}
                label="Riesgo más alto"
                onClick={worstFlag ? () => openReport(worstFlag) : undefined}
                cta="Ver informe"
            />
            <TriageCard
                accent={bestOpportunity ? "signal" : "muted"}
                detail={
                    bestOpportunity
                        ? `${bestOpportunity.entityName} · score ${bestOpportunity.score}`
                        : "Ninguna oportunidad abierta ahora mismo."
                }
                disabled={!bestOpportunity}
                headline={
                    bestOpportunity
                        ? bestOpportunity.title
                        : "Sin oportunidades"
                }
                label="Oportunidad más ganable"
                onClick={
                    bestOpportunity
                        ? () => openReport(bestOpportunity)
                        : undefined
                }
                cta="Ver informe"
            />
            <TriageCard
                accent={concentration.notable ? "flag" : "signal"}
                detail={
                    shared
                        ? `${shared.nit} representa a ${shared.represents.length} adjudicatarios distintos.`
                        : leader
                          ? `${leader.nit} se lleva ${leader.awards} de ${concentration.totalAwards} adjudicaciones.`
                          : "Aún no hay adjudicaciones que cruzar."
                }
                disabled={concentration.totalAwards === 0}
                headline={
                    concentration.totalAwards === 0
                        ? "Red sin adjudicaciones"
                        : concentration.notable
                          ? "Reparto concentrado"
                          : "Reparto disperso"
                }
                label={`Red · HHI ${concentration.hhi.toFixed(2)}`}
                onClick={
                    concentration.totalAwards > 0
                        ? () => copilot?.openNetwork()
                        : undefined
                }
                cta="Abrir la red"
            />
        </section>
    );
}

function TriageCard({
    accent,
    cta,
    detail,
    disabled,
    headline,
    label,
    onClick,
}: {
    accent: "flag" | "signal" | "muted";
    cta: string;
    detail: string;
    disabled?: boolean;
    headline: string;
    label: string;
    onClick?: () => void;
}) {
    return (
        <button
            className={cn(
                "group relative overflow-hidden rounded-lg border border-rule bg-card px-3.5 py-3 text-left transition-colors",
                disabled
                    ? "cursor-default opacity-70"
                    : "hover:border-signal/60 hover:bg-panel",
            )}
            disabled={disabled}
            onClick={onClick}
            type="button"
        >
            <span
                aria-hidden
                className={cn(
                    "absolute inset-y-0 left-0 w-[3px]",
                    accent === "flag"
                        ? "bg-flag"
                        : accent === "signal"
                          ? "bg-signal"
                          : "bg-rule",
                )}
            />
            <span className="block space-y-1.5 pl-2">
                <span
                    className={cn(
                        "label-ops block",
                        accent === "flag"
                            ? "text-flag"
                            : accent === "signal"
                              ? "text-signal"
                              : "text-muted-foreground",
                    )}
                >
                    {label}
                </span>
                <span className="block truncate font-display font-medium text-foreground text-sm leading-snug">
                    {headline}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {detail}
                </span>
                {!disabled && (
                    <span className="label-ops flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-signal">
                        {cta}
                        <ArrowRightIcon className="size-3" />
                    </span>
                )}
            </span>
        </button>
    );
}
