"use client";

import type { EntityMatch } from "@/core/copilot/client/analysis/entity-search";

/**
 * Generative-UI card for `searchEntities`: the catalog matches, so the user
 * sees the real NIT the copilot is about to propose watching. Display-only —
 * the copilot drives `proposeWatchlist` from here.
 */
export function EntityCandidatesCard({
    matches,
    query,
}: {
    matches: EntityMatch[];
    query: string;
}) {
    if (matches.length === 0)
        return (
            <p className="label-ops my-1 text-muted-foreground">
                Sin coincidencias para “{query}” en el catálogo. Pásame el NIT y
                lo vigilo directo.
            </p>
        );

    return (
        <section className="my-2 overflow-hidden rounded-md border border-rule bg-card">
            <header className="border-rule border-b bg-secondary/60 px-3.5 py-2">
                <p className="label-ops text-signal">Entidades encontradas</p>
            </header>
            <ul className="divide-y divide-rule">
                {matches.map((e) => (
                    <li className="px-3.5 py-2" key={e.nit}>
                        <p className="truncate font-display font-medium text-foreground text-sm">
                            {e.name}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                            NIT {e.nit} · {e.kind} · {e.sector}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
