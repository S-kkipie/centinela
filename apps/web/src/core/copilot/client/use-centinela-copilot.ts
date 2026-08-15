"use client";

import { useCopilotAppContext } from "@/core/copilot/client/context/use-copilot-app-context";
import { useFindingTools } from "@/core/copilot/client/tools/use-finding-tools";
import { useGraphTools } from "@/core/copilot/client/tools/use-graph-tools";
import { useWatchlistTools } from "@/core/copilot/client/tools/use-watchlist-tools";

/**
 * Single mount point for every copilot capability. The chat panel calls this
 * once.
 */
export function useCentinelaCopilot() {
    useCopilotAppContext();
    useFindingTools();
    useWatchlistTools();
    useGraphTools();
}
