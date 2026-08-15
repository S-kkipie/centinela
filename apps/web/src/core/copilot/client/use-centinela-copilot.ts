"use client";

import { useAgentBriefing } from "@/core/copilot/client/autonomy/use-agent-briefing";
import { useFeedWatcher } from "@/core/copilot/client/autonomy/use-feed-watcher";
import { useCopilotAppContext } from "@/core/copilot/client/context/use-copilot-app-context";
import { useCopilotSuggestions } from "@/core/copilot/client/suggestions/use-copilot-suggestions";
import { useAnalysisTools } from "@/core/copilot/client/tools/use-analysis-tools";
import { useDocumentTools } from "@/core/copilot/client/tools/use-document-tools";
import { useFindingTools } from "@/core/copilot/client/tools/use-finding-tools";
import { useGraphTools } from "@/core/copilot/client/tools/use-graph-tools";
import { useNetworkTools } from "@/core/copilot/client/tools/use-network-tools";
import { useWatchlistTools } from "@/core/copilot/client/tools/use-watchlist-tools";
import { useRevealTarget } from "@/core/copilot/client/ui/use-reveal-target";

/**
 * Single mount point for every copilot capability. The chat panel calls this
 * once and uses the returned state to show the suggestions loader.
 *
 * Order matters only in that the autonomy hooks (briefing, feed watcher) post
 * into the same thread the tools drive — everything else is registration.
 */
export function useCentinelaCopilot() {
    useCopilotAppContext();
    useFindingTools();
    useWatchlistTools();
    useGraphTools();
    useNetworkTools();
    useAnalysisTools();
    useDocumentTools();
    // The copilot acting on its own: it speaks first, and it interrupts.
    useAgentBriefing();
    useFeedWatcher();
    // Executes whatever scroll command the tools above queued.
    useRevealTarget();
    return useCopilotSuggestions();
}
