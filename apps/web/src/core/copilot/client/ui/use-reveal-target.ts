"use client";

import { useEffect } from "react";
import { useCopilotUi } from "@/core/copilot/client/store";

/**
 * Executes the store's pending reveal command: scrolls the region carrying
 * `data-reveal="<target>"` into view and flashes a halo around it.
 *
 * Without this, a copilot that "filters the inbox" or "highlights a NIT" leaves
 * the user staring at whatever was already on screen with no idea the console
 * changed somewhere else. Mount once, high in the authenticated tree.
 */
const HALO_MS = 1900;

export function useRevealTarget() {
    const { state, consumeReveal } = useCopilotUi();
    const reveal = state.reveal;

    useEffect(() => {
        if (!reveal) return;
        const node = document.querySelector<HTMLElement>(
            `[data-reveal="${reveal.target}"]`,
        );
        // The region may not be mounted (empty feed, no watchlist). Consume the
        // command anyway — a stuck command would block every later one.
        if (node) {
            node.scrollIntoView({ behavior: "smooth", block: "center" });
            node.classList.remove("reveal-halo");
            // Restart the animation: re-adding the class without a reflow is a
            // no-op when the same region is revealed twice in a row.
            void node.offsetWidth;
            node.classList.add("reveal-halo");
            const t = setTimeout(
                () => node.classList.remove("reveal-halo"),
                HALO_MS,
            );
            consumeReveal(reveal.nonce);
            return () => clearTimeout(t);
        }
        consumeReveal(reveal.nonce);
    }, [reveal, consumeReveal]);
}
