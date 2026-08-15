"use client";

import {
    useConfigureSuggestions,
    useSuggestions,
} from "@copilotkit/react-core/v2";
import { useEffect, useMemo, useRef, useState } from "react";
import { summarizeGraph } from "@/core/copilot/client/context/graph-summary";
import { useCopilotUi } from "@/core/copilot/client/store";
import { buildSuggestionInstructions } from "@/core/copilot/client/suggestions/instructions";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";
import { useWatchlists } from "@/core/watchlist/client/hooks";

/** Clicking through rows shouldn't fire one generation per click. */
const SETTLE_MS = 700;
/** Upper bound on how long the skeleton may stay up. */
const GIVE_UP_MS = 12_000;

function useSettled<T>(value: T, ms = SETTLE_MS): T {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setSettled(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return settled;
}

/**
 * Suggestion chips written by the model from whatever the user is looking at:
 * open a red flag and the chips turn into questions about its evidence and its
 * network. Regenerates once the user settles on something.
 */
export function useCopilotSuggestions() {
    const { state } = useCopilotUi();
    const { data: feed } = useFindingsFeed();
    const { data: watchlists } = useWatchlists();
    const { data: graph } = useGraph(state.selectedWatchlistId ?? undefined);

    const openFindingId = state.selectedFindingId;
    const watchlistId = state.selectedWatchlistId;

    const draftInstructions = useMemo(() => {
        const items = feed?.items ?? [];
        const openFinding = items.find((f) => f.id === openFindingId) ?? null;
        const scoped = watchlistId
            ? items.filter((f) => f.watchlistId === watchlistId)
            : items;
        const banderas = scoped.filter((f) => f.kind === "BANDERA_ROJA").length;
        const summary = summarizeGraph(graph?.edges ?? [], {
            flaggedFindingIds: new Set(
                scoped
                    .filter((f) => f.kind === "BANDERA_ROJA")
                    .map((f) => f.id),
            ),
        });
        return buildSuggestionInstructions({
            openFinding: openFinding && {
                id: openFinding.id,
                title: openFinding.title,
                entityName: openFinding.entityName,
                kind: openFinding.kind,
                score: openFinding.score,
            },
            watchlistName:
                (watchlists ?? []).find((w) => w.id === watchlistId)?.name ??
                null,
            findingCounts: {
                banderas,
                oportunidades: scoped.length - banderas,
            },
            topCounterpartyNit: summary.topCounterparty?.nit ?? null,
        });
    }, [feed, watchlists, graph, openFindingId, watchlistId]);

    // Settle the prompt itself, not just the ids: feed, graph and watchlist
    // resolve at different moments on load, and regenerating on each arrival
    // fired ~20 generations before the page had even settled.
    const instructions = useSettled(draftInstructions);

    useConfigureSuggestions(
        {
            instructions,
            minSuggestions: 2,
            maxSuggestions: 3,
            available: "always",
        },
        [instructions],
    );

    // Each regeneration appends, so the previous batch has to go. `instructions`
    // is the only trigger: `clearSuggestions` gets a new identity every render,
    // and depending on it turned this into a request storm that burned the
    // model's rate limit and left the chat answering nothing.
    const { suggestions, isLoading, clearSuggestions } = useSuggestions();
    const clearRef = useRef(clearSuggestions);
    clearRef.current = clearSuggestions;

    // `isLoading` alone leaves the chips row looking idle between the context
    // changing and the request starting, which is most of the wait. Track the
    // gap ourselves so the skeleton covers it end to end.
    const [pending, setPending] = useState(true);

    // Flip to loading the moment the user selects something, not when the
    // debounced prompt catches up — otherwise the stale chips sit there through
    // the settle window and the regeneration looks instantaneous.
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        setPending(true);
    }, [openFindingId, watchlistId]);

    const lastCleared = useRef<string | null>(null);
    useEffect(() => {
        if (lastCleared.current === null) {
            lastCleared.current = instructions; // nothing to clear on mount
            return;
        }
        if (lastCleared.current === instructions) return;
        lastCleared.current = instructions;
        setPending(true);
        clearRef.current();
    }, [instructions]);

    useEffect(() => {
        if (suggestions.length > 0) setPending(false);
    }, [suggestions]);

    // If generation never lands (rate limit, network), stop waiting so the row
    // falls back to chips instead of showing a skeleton forever.
    useEffect(() => {
        if (!pending) return;
        const t = setTimeout(() => setPending(false), GIVE_UP_MS);
        return () => clearTimeout(t);
    }, [pending]);

    return { isRegenerating: pending || isLoading };
}
