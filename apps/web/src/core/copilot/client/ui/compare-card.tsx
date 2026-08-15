"use client";

import type { Finding } from "@/core/finding/domain/types";
import { cn } from "@/frontend/lib/utils";
import { extractCuantia } from "./compare-select";

/** Kind badge in the feed's dark-ops idiom (verde señal / rojo bandera). */
function KindBadge({ kind }: { kind: Finding["kind"] }) {
    const isRed = kind === "BANDERA_ROJA";
    return (
        <span
            className={cn(
                "label-ops shrink-0 whitespace-nowrap rounded-sm px-1.5 py-0.5",
                isRed ? "bg-flag-soft text-flag" : "bg-signal-soft text-signal",
            )}
        >
            {isRed ? "Bandera roja" : "Oportunidad"}
        </span>
    );
}

function CompareColumn({ finding }: { finding: Finding }) {
    const cuantia = extractCuantia(finding.summary);
    return (
        <article className="flex min-w-0 flex-col gap-2 rounded-md border border-rule bg-background p-3">
            <header className="flex items-center justify-between gap-2">
                <KindBadge kind={finding.kind} />
                <span className="label-ops shrink-0 text-signal">
                    {finding.score}
                </span>
            </header>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
                {finding.entityName}
            </p>
            <h4 className="line-clamp-2 font-display font-medium text-foreground text-sm leading-snug">
                {finding.title}
            </h4>
            {cuantia && (
                <p className="font-mono text-signal text-xs">
                    Cuantía · {cuantia}
                </p>
            )}
            <p className="line-clamp-4 text-muted-foreground text-xs leading-relaxed">
                {finding.summary}
            </p>
        </article>
    );
}

/**
 * Side-by-side comparison of 2–3 OPORTUNIDAD findings, rendered as generative
 * UI inside the copilot thread. Fed from the already-polled feed cache via
 * `selectForCompare`, so every figure is grounded in real findings.
 */
export function CompareCard({ findings }: { findings: Finding[] }) {
    if (findings.length < 2)
        return (
            <p className="label-ops text-muted-foreground">
                Se necesitan al menos dos oportunidades para comparar.
            </p>
        );

    return (
        <section className="space-y-2">
            <header className="label-ops text-muted-foreground">
                Comparando {findings.length} oportunidades
            </header>
            <div
                className={cn(
                    "grid gap-2",
                    findings.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
                )}
            >
                {findings.map((f) => (
                    <CompareColumn finding={f} key={f.id} />
                ))}
            </div>
        </section>
    );
}
