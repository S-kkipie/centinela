"use client";

import { useEffect, useMemo, useState } from "react";
import { useCopilotUiOptional } from "@/core/copilot/client/store";
import { pickDefaultWatchlist } from "@/core/finding/client/default-watchlist";
import { useFindingsFeed } from "@/core/finding/client/hooks";
import { FindingsFeed } from "@/core/finding/client/ui/findings-feed";
import { useWatchlists } from "@/core/watchlist/client/hooks";
import { NumberTicker } from "@/frontend/components/aceternity/number-ticker";
import { ConsolaShader } from "@/frontend/components/aceternity/shader-fields";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";

const ALL = "__all__";

/** Machine-register timestamp: `2026-08-15 14:32Z`. */
function formatTs(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toISOString().slice(0, 16).replace("T", " ")}Z`;
}

export function Dashboard() {
    const { data: watchlists } = useWatchlists();
    const [selected, setSelected] = useState<string>(ALL);

    // Open on the watchlist the agent has actually reported on, so a brand-new
    // (empty) watchlist doesn't take over the Panel just for being newest.
    const { data: allFindings } = useFindingsFeed();
    useEffect(() => {
        if (selected !== ALL) return;
        const preferred = pickDefaultWatchlist(watchlists, allFindings?.items);
        if (preferred) setSelected(preferred);
    }, [watchlists, allFindings, selected]);

    const watchlistId = selected === ALL ? undefined : selected;

    // Publish the selection so the copilot reasons about what's on screen.
    const copilot = useCopilotUiOptional();
    const setSelectedWatchlist = copilot?.setSelectedWatchlist;
    useEffect(() => {
        setSelectedWatchlist?.(watchlistId ?? null);
    }, [watchlistId, setSelectedWatchlist]);

    // Shares the feed's react-query cache — same request the feed polls.
    const { data: feed } = useFindingsFeed({ watchlistId });
    const stats = useMemo(() => {
        const items = feed?.items ?? [];
        const banderas = items.filter((f) => f.kind === "BANDERA_ROJA").length;
        const latest = items.reduce(
            (max, f) => (f.updatedAt > max ? f.updatedAt : max),
            items[0]?.updatedAt ?? "",
        );
        return {
            total: feed?.total ?? 0,
            oportunidades: items.length - banderas,
            banderas,
            latest,
        };
    }, [feed]);

    return (
        <div className="bg-grid-ops">
            {/* Cabecera de sala: banda de grano tenue + telemetría real */}
            <section className="relative border-rule border-b bg-secondary">
                <ConsolaShader />
                <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-8 pb-6 md:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div className="space-y-1.5">
                            <p className="label-ops text-signal">
                                Consola del agente · en vivo
                            </p>
                            <h1 className="font-display font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
                                Sala de vigilancia
                            </h1>
                            <p className="max-w-[46ch] text-muted-foreground text-sm">
                                El agente barre el SECOP, cruza fuentes y
                                publica aquí cada veredicto con su evidencia.
                            </p>
                        </div>
                        <div className="w-full space-y-1 sm:w-64">
                            <span className="label-ops text-muted-foreground">
                                Vigilada
                            </span>
                            <Select
                                onValueChange={setSelected}
                                value={selected}
                            >
                                <SelectTrigger className="w-full rounded-sm border-rule bg-panel font-mono text-xs">
                                    <SelectValue placeholder="Vigilada" />
                                </SelectTrigger>
                                <SelectContent className="rounded-sm border-rule font-mono text-xs">
                                    <SelectItem value={ALL}>
                                        Todas las vigiladas
                                    </SelectItem>
                                    {watchlists?.map((wl) => (
                                        <SelectItem key={wl.id} value={wl.id}>
                                            {wl.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-rule border-t pt-5 sm:grid-cols-4">
                        <div className="leading-tight">
                            <dt className="label-ops text-muted-foreground">
                                Hallazgos
                            </dt>
                            <dd className="mt-1.5 font-mono font-semibold text-2xl text-foreground tabular-nums">
                                <NumberTicker value={stats.total} />
                            </dd>
                        </div>
                        <div className="leading-tight">
                            <dt className="label-ops text-muted-foreground">
                                Oportunidades
                            </dt>
                            <dd className="mt-1.5 font-mono font-semibold text-2xl text-signal tabular-nums">
                                <NumberTicker value={stats.oportunidades} />
                            </dd>
                        </div>
                        <div className="leading-tight">
                            <dt className="label-ops text-muted-foreground">
                                Banderas rojas
                            </dt>
                            <dd className="mt-1.5 font-mono font-semibold text-2xl text-flag tabular-nums">
                                <NumberTicker value={stats.banderas} />
                            </dd>
                        </div>
                        <div className="leading-tight">
                            <dt className="label-ops text-muted-foreground">
                                Último barrido
                            </dt>
                            <dd className="mt-1.5 font-mono text-foreground text-sm tracking-[0.04em]">
                                {stats.latest ? formatTs(stats.latest) : "—"}
                                <span className="mt-1 block label-ops text-muted-foreground">
                                    sondeo cada 5 s
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
                <FindingsFeed watchlistId={watchlistId} />
            </div>
        </div>
    );
}
