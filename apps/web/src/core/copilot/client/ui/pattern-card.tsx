"use client";

import {
    type ConcentrationReport,
    HHI_NOTABLE,
} from "@/core/copilot/client/analysis/concentration";
import { cn } from "@/frontend/lib/utils";

/**
 * Generative-UI card for `patternScan`: who is winning, how concentrated the
 * awards are, and which "competitors" share a representative. The bars matter
 * more than the numbers — concentration is a shape, not a figure.
 */
export function PatternCard({
    report,
    entityLabel,
}: {
    report: ConcentrationReport;
    entityLabel?: string;
}) {
    if (report.totalAwards === 0)
        return (
            <p className="label-ops my-1 text-muted-foreground">
                La red todavía no registra adjudicaciones que analizar.
            </p>
        );

    const concentrated = report.hhi >= HHI_NOTABLE;

    return (
        <article className="my-2 overflow-hidden rounded-md border border-rule bg-card">
            <header className="border-rule border-b bg-secondary/60 px-3.5 py-2.5">
                <p className="label-ops text-signal">
                    Concentración de adjudicaciones
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {entityLabel ? `${entityLabel} · ` : ""}
                    {report.totalAwards} adjudicaciones ·{" "}
                    {report.distinctWinners}{" "}
                    {report.distinctWinners === 1
                        ? "adjudicatario"
                        : "adjudicatarios"}
                </p>
            </header>

            <div className="space-y-3.5 px-3.5 py-3">
                <section>
                    <div className="flex items-baseline justify-between gap-3">
                        <h5 className="label-ops text-muted-foreground">
                            Índice HHI
                        </h5>
                        <span
                            className={cn(
                                "label-ops rounded-sm px-1.5 py-0.5",
                                concentrated
                                    ? "bg-flag-soft text-flag"
                                    : "bg-signal-soft text-signal",
                            )}
                        >
                            {report.hhi.toFixed(2)} ·{" "}
                            {concentrated ? "concentrado" : "disperso"}
                        </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                            className={cn(
                                "h-full rounded-full",
                                concentrated ? "bg-flag" : "bg-signal",
                            )}
                            style={{
                                width: `${Math.round(report.hhi * 100)}%`,
                            }}
                        />
                    </div>
                </section>

                <section>
                    <h5 className="label-ops text-muted-foreground">
                        Quién gana
                    </h5>
                    <ul className="mt-1.5 space-y-1.5">
                        {report.top.map((c) => (
                            <li key={c.nit}>
                                <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                                    <span
                                        className={cn(
                                            "truncate",
                                            c.flagged
                                                ? "text-flag"
                                                : "text-foreground",
                                        )}
                                    >
                                        {c.nit}
                                        {c.flagged ? " · bandera" : ""}
                                    </span>
                                    <span className="shrink-0 text-muted-foreground tabular-nums">
                                        {c.awards} · {Math.round(c.share * 100)}
                                        %
                                    </span>
                                </div>
                                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className={cn(
                                            "h-full rounded-full",
                                            c.flagged ? "bg-flag" : "bg-signal",
                                        )}
                                        style={{
                                            width: `${Math.round(c.share * 100)}%`,
                                        }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {report.sharedRepresentatives.length > 0 && (
                    <section>
                        <h5 className="label-ops text-flag">
                            Representantes compartidos
                        </h5>
                        <ul className="mt-1.5 space-y-1">
                            {report.sharedRepresentatives.map((s) => (
                                <li
                                    className="rounded-sm border border-rule bg-background px-2.5 py-1.5 font-mono text-[11px] leading-relaxed"
                                    key={s.nit}
                                >
                                    <span className="text-flag">{s.nit}</span>{" "}
                                    representa a{" "}
                                    <span className="text-foreground">
                                        {s.represents.join(", ")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                            Dos adjudicatarios distintos con el mismo
                            representante legal no compiten entre sí.
                        </p>
                    </section>
                )}
            </div>
        </article>
    );
}
