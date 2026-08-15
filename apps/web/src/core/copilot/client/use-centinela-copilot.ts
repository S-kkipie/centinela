"use client";

import { useCopilotAppContext } from "@/core/copilot/client/context/use-copilot-app-context";
import { useFindingTools } from "@/core/copilot/client/tools/use-finding-tools";

/**
 * Single mount point for every copilot capability. The chat panel calls this
 * once; workstreams append their hooks here as they land.
 */
export function useCentinelaCopilot() {
    useCopilotAppContext();
    useFindingTools();
    // WS-B: useWatchlistTools() — added at integration
    // WS-C: useGraphTools() — added at integration
}
