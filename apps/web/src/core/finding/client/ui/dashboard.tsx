"use client";

import { useEffect, useState } from "react";
import { ContractorGraph } from "@/core/finding/client/ui/contractor-graph";
import { FindingsFeed } from "@/core/finding/client/ui/findings-feed";
import { useWatchlists } from "@/core/watchlist/client/hooks";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";

const ALL = "__all__";

export function Dashboard() {
    const { data: watchlists } = useWatchlists();
    const [selected, setSelected] = useState<string>(ALL);

    // Default the graph to the first watchlist once they load.
    useEffect(() => {
        if (selected === ALL && watchlists && watchlists.length > 0) {
            setSelected(watchlists[0].id);
        }
    }, [watchlists, selected]);

    const watchlistId = selected === ALL ? undefined : selected;

    return (
        <div className="bg-grid-ops">
            <div className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <p className="label-ops text-muted-foreground">
                            Consola del agente
                        </p>
                        <h1 className="font-display font-semibold text-foreground text-xl">
                            Centinela
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            El agente vigila, cruza y expone en vivo.
                        </p>
                    </div>
                    <div className="w-full space-y-1 sm:w-64">
                        <span className="label-ops text-muted-foreground">
                            Vigilada
                        </span>
                        <Select onValueChange={setSelected} value={selected}>
                            <SelectTrigger className="w-full rounded-sm border-rule bg-panel font-mono text-xs">
                                <SelectValue placeholder="Vigilada" />
                            </SelectTrigger>
                            <SelectContent className="rounded-sm border-rule font-mono text-xs">
                                <SelectItem value={ALL}>
                                    Todas las vigiladas
                                </SelectItem>
                                {watchlists?.map((wl) => (
                                    <SelectItem key={wl.id} value={wl.id}>
                                        {wl.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="min-w-0 overflow-hidden rounded-lg border border-rule bg-panel">
                        <header className="flex items-center justify-between border-rule border-b bg-secondary/60 px-3 py-2">
                            <h2 className="label-ops text-muted-foreground">
                                Hallazgos
                            </h2>
                            <span className="label-ops flex items-center gap-1.5 text-signal">
                                <span
                                    aria-hidden
                                    className="size-1.5 rounded-full bg-signal motion-safe:animate-pulse"
                                />
                                Feed en vivo
                            </span>
                        </header>
                        <div className="p-3">
                            <FindingsFeed watchlistId={watchlistId} />
                        </div>
                    </section>
                    <section className="min-w-0 overflow-hidden rounded-lg border border-rule bg-panel">
                        <header className="flex items-center justify-between border-rule border-b bg-secondary/60 px-3 py-2">
                            <h2 className="label-ops text-muted-foreground">
                                Red de contratistas
                            </h2>
                            <span className="label-ops text-muted-foreground">
                                NIT / relación
                            </span>
                        </header>
                        <div className="p-3">
                            <ContractorGraph watchlistId={watchlistId} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
