"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";
import {
    briefingToMessage,
    composeBriefing,
} from "@/core/copilot/client/autonomy/briefing";
import { useCopilotUi } from "@/core/copilot/client/store";
import { useFindingsFeed } from "@/core/finding/client/hooks";
import { useWatchlists } from "@/core/watchlist/client/hooks";

/** Where the last visit is remembered, so "nuevo desde ayer" is a real claim. */
export const LAST_SEEN_KEY = "centinela:last-seen-at";

function readLastSeen(): string | null {
    try {
        return window.localStorage.getItem(LAST_SEEN_KEY);
    } catch {
        // Private mode / storage disabled: degrade to a first-visit briefing.
        return null;
    }
}

function writeLastSeen(iso: string): void {
    try {
        window.localStorage.setItem(LAST_SEEN_KEY, iso);
    } catch {
        // Nothing to do — next visit is simply treated as the first.
    }
}

/**
 * Posts the opening briefing into the chat, unprompted, once per session.
 *
 * Deliberately not a model call: the message is composed from the polled feed,
 * so it is instant, cannot invent a finding, and reads the same every time. The
 * model takes over from the user's first reply.
 */
export function useAgentBriefing() {
    const { agent } = useAgent();
    const { state, setBriefingAt, pushActivity, focusFinding, reveal } =
        useCopilotUi();
    const { data: feed } = useFindingsFeed();
    const { data: watchlists } = useWatchlists();

    // The effect must fire exactly once, and `briefingAt` lands a render later
    // than the second call would happen on a fast cache hit.
    const delivered = useRef(false);

    useEffect(() => {
        if (delivered.current || state.briefingAt) return;
        // Wait for both queries: briefing on half the data would tell the user
        // they have no watchlists while the request is still in flight.
        if (!feed || !watchlists) return;
        delivered.current = true;

        const now = new Date();
        const briefing = composeBriefing({
            findings: feed.items,
            watchlistNames: watchlists.map((w) => w.name),
            lastSeenAt: readLastSeen(),
            now,
        });
        writeLastSeen(now.toISOString());

        const action = briefing.action;
        const lines = [briefingToMessage(briefing)];
        if (action?.kind === "openFinding") {
            lines.push("Te dejé su informe abierto en el Panel.");
        }

        agent.addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: lines.join("\n"),
        });
        setBriefingAt(now.toISOString());
        pushActivity({ kind: "copiloto", text: briefing.headline });

        if (action?.kind === "openFinding") {
            focusFinding(action.findingId);
            reveal("informe", "La bandera roja más alta del Panel");
        }
    }, [
        feed,
        watchlists,
        agent,
        state.briefingAt,
        setBriefingAt,
        pushActivity,
        focusFinding,
        reveal,
    ]);
}
