"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";
import {
    alertMessage,
    describeDiff,
    diffFeed,
} from "@/core/copilot/client/autonomy/feed-diff";
import { useCopilotUi } from "@/core/copilot/client/store";
import { useFindingsFeed } from "@/core/finding/client/hooks";

/**
 * Turns the 5-second feed poll into the agent's heartbeat.
 *
 * Findings used to appear silently in a list nobody was looking at. Now every
 * sweep that lands something writes a line in the activity ticker, and a fresh
 * high-scoring red flag makes the copilot interrupt on its own and take the
 * user to the report. That interruption is the whole difference between a chat
 * box and a copilot.
 */
export function useFeedWatcher() {
    const { agent } = useAgent();
    const { data: feed } = useFindingsFeed();
    const { pushActivity, focusFinding, reveal } = useCopilotUi();

    // Ids present at the moment the watcher started. The first poll is the
    // baseline, never an alert — otherwise every page load screams.
    const seen = useRef<Set<string> | null>(null);

    useEffect(() => {
        if (!feed) return;
        const items = feed.items;

        if (seen.current === null) {
            seen.current = new Set(items.map((f) => f.id));
            return;
        }

        const diff = diffFeed(seen.current, items);
        if (diff.fresh.length === 0) return;
        for (const f of diff.fresh) seen.current.add(f.id);

        const line = describeDiff(diff);
        if (line)
            pushActivity({
                kind: diff.freshRedFlags.length > 0 ? "bandera" : "barrido",
                text: line,
            });

        if (!diff.alert) return;
        agent.addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: alertMessage(diff.alert),
        });
        focusFinding(diff.alert.id);
        reveal("informe", `Bandera roja nueva en ${diff.alert.entityName}`);
    }, [feed, agent, pushActivity, focusFinding, reveal]);
}
