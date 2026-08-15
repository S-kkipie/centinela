"use client";

import type { Finding } from "@/core/finding/domain/types";
import { cn } from "@/frontend/lib/utils";

/**
 * Generative UI card rendered inside the copilot thread by `explainFinding`:
 * the agent's verdict plus the cited evidence chain, in the same visual
 * language as the Informe panel.
 */
export function EvidenceCard({ finding }: { finding: Finding }) {
    const isRed = finding.kind === "BANDERA_ROJA";
    return (
        <article className="my-2 overflow-hidden rounded-md border border-rule bg-card">
            <header
                className={cn(
                    "border-b-2 px-3.5 py-2.5",
                    isRed ? "border-flag" : "border-signal",
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <span
                        className={cn(
                            "label-ops rounded-sm px-1.5 py-0.5",
                            isRed
                                ? "bg-flag-soft text-flag"
                                : "bg-signal-soft text-signal",
                        )}
                    >
                        {isRed ? "Bandera roja" : "Oportunidad"} ·{" "}
                        {finding.score}
                    </span>
                    <span className="label-ops shrink-0 text-muted-foreground">
                        {finding.tenderId}
                    </span>
                </div>
                <h4 className="mt-1.5 font-display font-medium text-foreground text-sm leading-snug">
                    {finding.title}
                </h4>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {finding.entityName}
                </p>
            </header>
            <div className="space-y-3 px-3.5 py-3">
                <section>
                    <h5 className="label-ops text-muted-foreground">
                        Veredicto del agente
                    </h5>
                    <p className="mt-1 text-foreground text-xs leading-relaxed">
                        {finding.summary}
                    </p>
                </section>
                {finding.evidence.length > 0 && (
                    <section>
                        <h5 className="label-ops text-muted-foreground">
                            Evidencia citada · {finding.evidence.length}
                        </h5>
                        <ul className="mt-1.5 space-y-1.5">
                            {finding.evidence.map((e, i) => (
                                <li
                                    className="rounded-sm border border-rule bg-background px-2.5 py-1.5 font-mono text-[11px] leading-relaxed"
                                    key={`${finding.id}-cev-${i}`}
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
            </div>
        </article>
    );
}
