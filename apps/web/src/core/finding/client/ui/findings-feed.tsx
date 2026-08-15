"use client";

import { useFindingsFeed } from "@/core/finding/client/hooks";
import type { Finding } from "@/core/finding/domain/types";
import { Badge } from "@/frontend/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { Spinner } from "@/frontend/components/ui/spinner";

function KindBadge({ kind }: { kind: Finding["kind"] }) {
    const isRed = kind === "BANDERA_ROJA";
    return (
        <Badge
            className={
                isRed
                    ? "bg-red-600 text-white hover:bg-red-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-600"
            }
        >
            {isRed ? "🚩 BANDERA ROJA" : "💰 OPORTUNIDAD"}
        </Badge>
    );
}

function FindingCard({ finding }: { finding: Finding }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-base">
                            {finding.title}
                        </CardTitle>
                        <CardDescription>
                            {finding.entityName} · tender {finding.tenderId}
                        </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <KindBadge kind={finding.kind} />
                        <span className="font-mono text-muted-foreground text-xs">
                            score {finding.score}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm">{finding.summary}</p>
                {finding.evidence.length > 0 && (
                    <ul className="space-y-1 border-l-2 pl-3 text-muted-foreground text-xs">
                        {finding.evidence.map((e, i) => (
                            <li key={`${finding.id}-ev-${i}`}>
                                <span className="font-medium">{e.source}:</span>{" "}
                                {e.url ? (
                                    <a
                                        className="underline"
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
            </CardContent>
        </Card>
    );
}

/** The demo centerpiece: the agent's findings streaming in via polling. */
export function FindingsFeed({ watchlistId }: { watchlistId?: string }) {
    const { data, isLoading, isError } = useFindingsFeed({ watchlistId });

    if (isLoading)
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Spinner /> Cargando feed…
            </div>
        );
    if (isError)
        return (
            <p className="text-red-600 text-sm">No se pudo cargar el feed.</p>
        );
    if (!data || data.items.length === 0)
        return (
            <p className="text-muted-foreground text-sm">
                Sin hallazgos todavía. El agente los publicará aquí en vivo.
            </p>
        );

    return (
        <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
                {data.total} hallazgos · actualiza cada 5s
            </p>
            {data.items.map((f) => (
                <FindingCard finding={f} key={f.id} />
            ))}
        </div>
    );
}
