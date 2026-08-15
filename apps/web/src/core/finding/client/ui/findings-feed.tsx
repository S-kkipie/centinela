"use client";

import { motion, useReducedMotion } from "motion/react";
import { useFindingsFeed } from "@/core/finding/client/hooks";
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

function FindingCard({ finding }: { finding: Finding }) {
    const reduced = useReducedMotion();
    return (
        <motion.article
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-md border border-rule bg-panel"
            initial={reduced ? false : { opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="flex items-start justify-between gap-3 border-rule border-b px-3 py-2">
                <div className="min-w-0 space-y-0.5">
                    <h3 className="font-display font-medium text-foreground text-sm leading-snug">
                        {finding.title}
                    </h3>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {finding.entityName} · tender {finding.tenderId}
                    </p>
                </div>
                <ScoreChip kind={finding.kind} score={finding.score} />
            </div>
            <div className="space-y-2.5 px-3 py-2.5">
                <p className="text-foreground text-sm leading-relaxed">
                    {finding.summary}
                </p>
                {finding.evidence.length > 0 && (
                    <ul className="space-y-1 border-l-2 border-rule pl-2.5">
                        {finding.evidence.map((e, i) => (
                            <li
                                className="font-mono text-[11px] text-muted-foreground leading-relaxed"
                                key={`${finding.id}-ev-${i}`}
                            >
                                <span className="text-foreground">
                                    {e.source}
                                </span>{" "}
                                ·{" "}
                                {e.url ? (
                                    <a
                                        className="underline decoration-rule underline-offset-2 hover:text-foreground"
                                        href={e.url}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {e.claim}
                                    </a>
                                ) : (
                                    e.claim
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                <p className="label-ops text-muted-foreground">
                    {formatTs(finding.createdAt)}
                </p>
            </div>
        </motion.article>
    );
}

/** The demo centerpiece: the agent's findings streaming in via polling. */
export function FindingsFeed({ watchlistId }: { watchlistId?: string }) {
    const { data, isLoading, isError } = useFindingsFeed({ watchlistId });

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

    const latest = data.items.reduce(
        (max, f) => (f.updatedAt > max ? f.updatedAt : max),
        data.items[0].updatedAt,
    );

    return (
        <div className="space-y-3">
            <p className="label-ops text-muted-foreground">
                {data.total} hallazgos · último barrido {formatTs(latest)} ·
                sondeo 5s
            </p>
            {data.items.map((f) => (
                <FindingCard finding={f} key={f.id} />
            ))}
        </div>
    );
}
