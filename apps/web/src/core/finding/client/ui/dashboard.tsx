"use client";

import { RadarIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SweepError, useTriggerSweep } from "@/core/agent/client/hooks";
import { useCopilotUiOptional } from "@/core/copilot/client/store";
import { pickDefaultWatchlist } from "@/core/finding/client/default-watchlist";
import { useFindingsFeed } from "@/core/finding/client/hooks";
import { FindingsFeed } from "@/core/finding/client/ui/findings-feed";
import { TriageRow } from "@/core/finding/client/ui/triage-row";
import { useWatchlists } from "@/core/watchlist/client/hooks";
import { NumberTicker } from "@/frontend/components/aceternity/number-ticker";
import { ConsolaShader } from "@/frontend/components/aceternity/shader-fields";
import { Button } from "@/frontend/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";
import { Spinner } from "@/frontend/components/ui/spinner";
import { cn } from "@/frontend/lib/utils";

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
                <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-5 pb-4 md:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                        <div className="space-y-1">
                            <p className="label-ops text-signal">
                                Consola del agente · en vivo
                            </p>
                            <h1 className="font-display font-semibold text-foreground text-xl tracking-tight md:text-2xl">
                                Sala de vigilancia
                            </h1>
                        </div>
                        <div className="flex w-full items-end gap-2 sm:w-auto">
                            <div className="w-full space-y-1 sm:w-56">
                                <span className="label-ops text-muted-foreground">
                                    Frente
                                </span>
                                <Select
                                    onValueChange={setSelected}
                                    value={selected}
                                >
                                    <SelectTrigger className="w-full rounded-sm border-rule bg-panel font-mono text-xs">
                                        <SelectValue placeholder="Frente" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-sm border-rule font-mono text-xs">
                                        <SelectItem value={ALL}>
                                            Todos los frentes
                                        </SelectItem>
                                        {watchlists?.map((wl) => (
                                            <SelectItem
                                                key={wl.id}
                                                value={wl.id}
                                            >
                                                {wl.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <SweepButton
                                hasWatchlists={(watchlists?.length ?? 0) > 0}
                            />
                        </div>
                    </div>
                    {/* Telemetría en una banda, no en un bloque: la mitad
                        superior de la consola tiene que ser accionable. */}
                    <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-rule border-t pt-3">
                        <Metric label="Hallazgos" value={stats.total} />
                        <Metric
                            label="Oportunidades"
                            tone="signal"
                            value={stats.oportunidades}
                        />
                        <Metric
                            label="Banderas rojas"
                            tone="flag"
                            value={stats.banderas}
                        />
                        <div className="flex items-baseline gap-2">
                            <dt className="label-ops text-muted-foreground">
                                Último barrido
                            </dt>
                            <dd className="font-mono text-foreground text-xs tracking-[0.04em] tabular-nums">
                                {stats.latest ? formatTs(stats.latest) : "—"}
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 md:px-6">
                <TriageRow watchlistId={watchlistId} />
                <FindingsFeed watchlistId={watchlistId} />
            </div>
        </div>
    );
}

/**
 * Runs the agent's heartbeat on demand — "show me now" instead of waiting for
 * the two-hour cron. The sweep only enqueues; investigations land over the next
 * seconds, so the copy promises "en camino", not instant results.
 */
function SweepButton({ hasWatchlists }: { hasWatchlists: boolean }) {
    const sweep = useTriggerSweep();
    const run = () => {
        sweep.mutate(undefined, {
            onSuccess: (r) => {
                toast.success(
                    r.enqueued > 0
                        ? `Barrido lanzado: ${r.enqueued} proceso${r.enqueued === 1 ? "" : "s"} en investigación.`
                        : `Barrido hecho sobre ${r.targets} objetivo${r.targets === 1 ? "" : "s"}: sin procesos nuevos por ahora.`,
                );
            },
            onError: (e) => {
                const noTargets = e instanceof SweepError && e.status === 400;
                toast.error(
                    noTargets
                        ? "Crea un frente con una entidad antes de barrer."
                        : "No se pudo lanzar el barrido. Intenta de nuevo.",
                );
            },
        });
    };
    return (
        <Button
            className="label-ops h-9 shrink-0 gap-1.5"
            disabled={sweep.isPending || !hasWatchlists}
            onClick={run}
            size="sm"
            title={
                hasWatchlists
                    ? "Ejecuta un barrido ahora"
                    : "Crea un frente primero"
            }
        >
            {sweep.isPending ? (
                <>
                    <Spinner className="size-3.5" /> Barriendo…
                </>
            ) : (
                <>
                    <RadarIcon className="size-3.5" /> Barrer ahora
                </>
            )}
        </Button>
    );
}

/** One inline telemetry reading in the header band. */
function Metric({
    label,
    tone,
    value,
}: {
    label: string;
    tone?: "signal" | "flag";
    value: number;
}) {
    return (
        <div className="flex items-baseline gap-2">
            <dt className="label-ops text-muted-foreground">{label}</dt>
            <dd
                className={cn(
                    "font-mono font-semibold text-base tabular-nums",
                    tone === "signal"
                        ? "text-signal"
                        : tone === "flag"
                          ? "text-flag"
                          : "text-foreground",
                )}
            >
                <NumberTicker value={value} />
            </dd>
        </div>
    );
}
