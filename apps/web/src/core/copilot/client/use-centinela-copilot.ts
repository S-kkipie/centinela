"use client";

import { useCopilotAppContext } from "@/core/copilot/client/context/use-copilot-app-context";
import { useCopilotSuggestions } from "@/core/copilot/client/suggestions/use-copilot-suggestions";
import { useFindingTools } from "@/core/copilot/client/tools/use-finding-tools";
import { useGraphTools } from "@/core/copilot/client/tools/use-graph-tools";
import { useWatchlistTools } from "@/core/copilot/client/tools/use-watchlist-tools";

/**
 * Single mount point for every copilot capability. The chat panel calls this
 * once and uses the returned state to show the suggestions loader.
 */
export function useCentinelaCopilot() {
    useCopilotAppContext();
    useFindingTools();
    useWatchlistTools();
    useGraphTools();
    return useCopilotSuggestions();
}
