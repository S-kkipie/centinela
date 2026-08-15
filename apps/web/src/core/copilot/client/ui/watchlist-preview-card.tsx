"use client";

import type { WatchlistEntityInput } from "@/core/copilot/client/tools/watchlist-tools-core";
import { Button } from "@/frontend/components/ui/button";
import { Spinner } from "@/frontend/components/ui/spinner";

/**
 * HITL preview rendered inside the copilot thread before any DB write: the
 * proposed watchlist name, its entity rows, and Confirmar / Cancelar. Buttons
 * disable while the confirm is in flight so a double-click cannot write twice.
 * Same dark-ops language as watchlist-manager.tsx.
 */
export function WatchlistPreviewCard({
    name,
    entities,
    heading = "Vigilada propuesta",
    pending = false,
    error,
    onConfirm,
    onCancel,
}: {
    name?: string;
    entities: WatchlistEntityInput[];
    /** "Vigilada propuesta" (create) or "Agregar a vigilada" (extend). */
    heading?: string;
    pending?: boolean;
    error?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <article className="my-2 overflow-hidden rounded-md border border-rule bg-card">
            <header className="border-signal border-b-2 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-3">
                    <span className="label-ops rounded-sm bg-signal-soft px-1.5 py-0.5 text-signal">
                        {heading}
                    </span>
                    <span className="label-ops shrink-0 text-muted-foreground">
                        {entities.length}{" "}
                        {entities.length === 1 ? "entidad" : "entidades"}
                    </span>
                </div>
                {name && (
                    <h4 className="mt-1.5 font-display font-medium text-foreground text-sm leading-snug">
                        {name}
                    </h4>
                )}
            </header>

            <div className="space-y-3 px-3.5 py-3">
                <ul className="space-y-1.5">
                    {entities.map((e, i) => (
                        <li
                            className="flex items-baseline justify-between gap-3 rounded-sm border border-rule bg-background px-2.5 py-1.5 text-sm"
                            key={`${e.nit}-${i}`}
                        >
                            <span className="flex min-w-0 items-baseline gap-2">
                                <span
                                    aria-hidden
                                    className="size-1.5 shrink-0 self-center rounded-full bg-signal"
                                />
                                <span className="truncate font-medium">
                                    {e.entityName}
                                </span>
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                NIT {e.nit}
                            </span>
                        </li>
                    ))}
                </ul>

                {error && <p className="label-ops text-flag">{error}</p>}

                <div className="flex items-center justify-end gap-2">
                    <Button
                        className="label-ops h-8 px-3 text-muted-foreground hover:text-flag"
                        disabled={pending}
                        onClick={onCancel}
                        size="sm"
                        variant="ghost"
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="label-ops h-8 px-4 text-signal"
                        disabled={pending}
                        onClick={onConfirm}
                        size="sm"
                    >
                        {pending ? (
                            <span className="flex items-center gap-1.5">
                                <Spinner /> Confirmando…
                            </span>
                        ) : (
                            "Confirmar"
                        )}
                    </Button>
                </div>
            </div>
        </article>
    );
}

/** Loading placeholder shown while the agent is still streaming the proposal. */
export function WatchlistPreviewSkeleton() {
    return (
        <div className="my-2 flex items-center gap-2 rounded-md border border-rule border-dashed bg-card px-3.5 py-3 font-mono text-muted-foreground text-xs">
            <Spinner /> Preparando propuesta de vigilada…
        </div>
    );
}
