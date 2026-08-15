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
        <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-semibold text-xl">Centinela</h1>
                    <p className="text-muted-foreground text-sm">
                        El agente vigila, cruza y expone en vivo.
                    </p>
                </div>
                <Select onValueChange={setSelected} value={selected}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Watchlist" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>
                            Todas las watchlists
                        </SelectItem>
                        {watchlists?.map((wl) => (
                            <SelectItem key={wl.id} value={wl.id}>
                                {wl.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="space-y-3">
                    <h2 className="font-medium text-sm uppercase tracking-wide">
                        Feed de hallazgos
                    </h2>
                    <FindingsFeed watchlistId={watchlistId} />
                </section>
                <section className="space-y-3">
                    <h2 className="font-medium text-sm uppercase tracking-wide">
                        Red de contratistas
                    </h2>
                    <ContractorGraph watchlistId={watchlistId} />
                </section>
            </div>
        </div>
    );
}
