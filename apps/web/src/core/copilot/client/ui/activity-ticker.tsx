"use client";

import { ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { type ActivityEntry, useCopilotUi } from "@/core/copilot/client/store";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { cn } from "@/frontend/lib/utils";

/** `2026-08-15T14:32:00Z` -> `14:32`. */
function clock(iso: string): string {
    return iso.slice(11, 16);
}

const DOT: Record<ActivityEntry["kind"], string> = {
    barrido: "bg-muted-foreground",
    bandera: "bg-flag",
    copiloto: "bg-signal",
};

/**
 * Proof of life. The agent's heartbeat runs whether or not anyone is watching,
 * and the console never said so: a user who saw nothing move assumed nothing
 * ran. One sticky line at the bottom carries the last thing that happened, and
 * expands into the recent log.
 */
export function ActivityTicker() {
    const { state } = useCopilotUi();
    const [open, setOpen] = useState(false);
    const entries = state.activity;
    const latest = entries[0];

    return (
        <div className="sticky bottom-0 z-30 border-rule border-t bg-panel/90 backdrop-blur">
            {open && entries.length > 0 && (
                <ScrollArea
                    className="border-rule border-b"
                    viewportClassName="max-h-48"
                >
                    <ul className="mx-auto w-full max-w-6xl space-y-1 px-4 py-2 md:px-6">
                        {entries.map((e) => (
                            <li
                                className="flex items-start gap-2 font-mono text-[11px] leading-relaxed"
                                key={e.id}
                            >
                                <span className="shrink-0 text-muted-foreground tabular-nums">
                                    {clock(e.at)}
                                </span>
                                <span
                                    aria-hidden
                                    className={cn(
                                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                                        DOT[e.kind],
                                    )}
                                />
                                <span className="min-w-0 text-muted-foreground">
                                    {e.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            )}
            <button
                aria-expanded={open}
                className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-2 text-left md:px-6"
                disabled={entries.length === 0}
                onClick={() => setOpen((v) => !v)}
                type="button"
            >
                <span className="label-ops shrink-0 text-muted-foreground">
                    Actividad del agente
                </span>
                <span
                    aria-hidden
                    className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        latest ? DOT[latest.kind] : "bg-rule",
                    )}
                />
                <span
                    className={cn(
                        "min-w-0 flex-1 truncate font-mono text-[11px]",
                        latest?.kind === "bandera"
                            ? "text-flag"
                            : "text-muted-foreground",
                    )}
                >
                    {latest
                        ? `${clock(latest.at)} · ${latest.text}`
                        : "En espera del próximo barrido…"}
                </span>
                {entries.length > 0 && (
                    <span className="label-ops flex shrink-0 items-center gap-1 text-muted-foreground">
                        {entries.length}
                        <ChevronUpIcon
                            className={cn(
                                "size-3 transition-transform",
                                open && "rotate-180",
                            )}
                        />
                    </span>
                )}
            </button>
        </div>
    );
}
