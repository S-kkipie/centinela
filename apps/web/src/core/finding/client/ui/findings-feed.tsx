"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { useFindingsFeed } from "@/core/finding/client/hooks";
import { ContractorGraph } from "@/core/finding/client/ui/contractor-graph";
import type { Finding } from "@/core/finding/domain/types";
import { Spinner } from "@/frontend/components/ui/spinner";
import { cn } from "@/frontend/lib/utils";

/** Machine-register timestamp: `2026-08-15 14:32Z`. */
function formatTs(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toISOString().slice(0, 16).replace("T", " ")}Z`;
}

function ScoreChip({ kind, score }: { kind: Finding["kind"]; score: number }) {
    const isRed = kind === "BANDERA_ROJA";
    return (
        <span
            className={cn(
                "label-ops shrink-0 whitespace-nowrap rounded-sm px-1.5 py-0.5",
                isRed ? "bg-flag-soft text-flag" : "bg-signal-soft text-signal",
            )}
        >
            {kind} · {score}
        </span>
    );
}

/** Fila compacta del inbox: veredicto + título + slug. El informe vive en
 * el panel de detalle, no aquí. */
function FindingRow({
    finding,
    active,
    onSelect,
    index,
}: {
    finding: Finding;
    active: boolean;
    onSelect: () => void;
    index: number;
}) {
    const reduced = useReducedMotion();
    const isRed = finding.kind === "BANDERA_ROJA";
    return (
        <motion.button
            animate={{ opacity: 1, y: 0 }}
            aria-current={active ? "true" : undefined}
            className={cn(
                "group relative w-full overflow-hidden rounded-md border text-left transition-colors",
                active
                    ? "border-rule bg-panel"
                    : "border-transparent hover:border-rule hover:bg-panel/60",
            )}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            onClick={onSelect}
            transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
                delay: reduced ? 0 : Math.min(index * 0.04, 0.24),
            }}
            type="button"
        >
            <span
                aria-hidden
                className={cn(
                    "absolute inset-y-0 left-0 w-[3px] transition-opacity",
                    isRed ? "bg-flag" : "bg-signal",
                    active ? "opacity-100" : "opacity-40",
                )}
            />
            <span className="block space-y-1 py-2.5 pr-3 pl-4">
                <span className="flex items-center justify-between gap-3">
                    <span
                        className={cn(
                            "label-ops",
                            isRed ? "text-flag" : "text-signal",
                        )}
                    >
                        {isRed ? "Bandera roja" : "Oportunidad"} ·{" "}
                        {finding.score}
                    </span>
                    <span className="label-ops shrink-0 text-muted-foreground">
                        {formatTs(finding.createdAt).slice(11)}
                    </span>
                </span>
                <span className="block truncate font-display font-medium text-foreground text-sm leading-snug">
                    {finding.title}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {finding.entityName} · {finding.tenderId}
                </span>
            </span>
        </motion.button>
    );
}

/** Informe completo del hallazgo seleccionado. */
function FindingReport({
    finding,
    watchlistId,
}: {
    finding: Finding;
    watchlistId?: string;
}) {
    const isRed = finding.kind === "BANDERA_ROJA";
    return (
        <article>
            <header
                className={cn(
                    "border-b-2 px-5 py-4",
                    isRed ? "border-flag" : "border-signal",
                )}
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ScoreChip kind={finding.kind} score={finding.score} />
                    <span className="label-ops text-muted-foreground">
                        {formatTs(finding.createdAt)}
                    </span>
                </div>
                <h3 className="mt-2.5 font-display font-semibold text-foreground text-lg leading-snug">
                    {finding.title}
                </h3>
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                    {finding.entityName} · proceso {finding.tenderId}
                </p>
            </header>

            <div className="space-y-6 px-5 py-5">
                <section>
                    <h4 className="label-ops text-muted-foreground">
                        Veredicto del agente
                    </h4>
                    <p className="mt-2 text-foreground text-sm leading-relaxed">
                        {finding.summary}
                    </p>
                </section>

                {finding.evidence.length > 0 && (
                    <section>
                        <h4 className="label-ops text-muted-foreground">
                            Evidencia citada · {finding.evidence.length}
                        </h4>
                        <ul className="mt-2 space-y-2">
                            {finding.evidence.map((e, i) => (
                                <li
                                    className="rounded-sm border border-rule bg-background px-3 py-2 font-mono text-[11px] leading-relaxed"
                                    key={`${finding.id}-ev-${i}`}
                                >
                                    <span className="text-signal">
                                        {e.source}
                                    </span>{" "}
                                    ·{" "}
                                    {e.url ? (
                                        <a
                                            className="text-muted-foreground underline decoration-rule underline-offset-2 hover:text-foreground"
                                            href={e.url}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            {e.claim}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            {e.claim}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section>
                    <h4 className="label-ops text-muted-foreground">
                        Red de contratistas del hallazgo
                    </h4>
                    <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                        Cada nodo es un NIT que aparece en las fuentes; cada
                        línea, una relación detectada. Rojo = tocado por una
                        bandera roja.
                    </p>
                    <div className="mt-3">
                        <ContractorGraph
                            findingId={finding.id}
                            watchlistId={watchlistId}
                        />
                    </div>
                </section>
            </div>
        </article>
    );
}

/** The demo centerpiece: inbox de hallazgos (izq) + informe (der). */
export function FindingsFeed({ watchlistId }: { watchlistId?: string }) {
    const { data, isLoading, isError } = useFindingsFeed({ watchlistId });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    if (isLoading)
        return (
            <div className="label-ops flex items-center gap-2 text-muted-foreground">
                <Spinner className="size-3.5" /> Cargando feed…
            </div>
        );
    if (isError)
        return (
            <p className="label-ops text-flag">No se pudo cargar el feed.</p>
        );
    if (!data || data.items.length === 0)
        return (
            <p className="text-muted-foreground text-sm">
                Sin hallazgos todavía. El agente los publicará aquí en vivo.
            </p>
        );

    const selected =
        data.items.find((f) => f.id === selectedId) ?? data.items[0];

    const select = (id: string) => {
        setSelectedId(id);
        // En una sola columna (móvil) el informe queda debajo: llévalo a vista.
        if (window.innerWidth < 1024) {
            requestAnimationFrame(() =>
                reportRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                }),
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <section className="min-w-0 self-start lg:sticky lg:top-16">
                    <div className="overflow-hidden rounded-lg border border-rule bg-card">
                        <header className="flex items-center justify-between border-rule border-b bg-secondary/60 px-3.5 py-2.5">
                            <h2 className="label-ops text-muted-foreground">
                                Hallazgos · {data.total}
                            </h2>
                            <span className="label-ops flex items-center gap-1.5 text-signal">
                                <span
                                    aria-hidden
                                    className="relative flex size-1.5"
                                >
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:hidden" />
                                    <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                                </span>
                                En vivo
                            </span>
                        </header>
                        <div className="space-y-1 p-2 lg:max-h-[calc(100svh-9.5rem)] lg:overflow-y-auto">
                            {data.items.map((f, i) => (
                                <FindingRow
                                    active={f.id === selected.id}
                                    finding={f}
                                    index={i}
                                    key={f.id}
                                    onSelect={() => select(f.id)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    className="min-w-0 self-start lg:sticky lg:top-16"
                    ref={reportRef}
                >
                    <div className="overflow-hidden rounded-lg border border-rule bg-card">
                        <header className="flex items-center justify-between border-rule border-b bg-secondary/60 px-3.5 py-2.5">
                            <h2 className="label-ops text-muted-foreground">
                                Informe
                            </h2>
                            <span className="label-ops text-muted-foreground">
                                sondeo 5 s
                            </span>
                        </header>
                        <FindingReport
                            finding={selected}
                            key={selected.id}
                            watchlistId={watchlistId}
                        />
                    </div>
                </section>
            </div>

            {/* Red completa de la vigilada: todos los NITs y relaciones */}
            <section className="min-w-0 overflow-hidden rounded-lg border border-rule bg-card">
                <header className="flex items-center justify-between border-rule border-b bg-secondary/60 px-3.5 py-2.5">
                    <h2 className="label-ops text-muted-foreground">
                        Red general de contratistas
                    </h2>
                    <span className="label-ops text-muted-foreground">
                        toda la vigilada
                    </span>
                </header>
                <div className="p-3.5">
                    <ContractorGraph watchlistId={watchlistId} />
                </div>
            </section>
        </div>
    );
}
