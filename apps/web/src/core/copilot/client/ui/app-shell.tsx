"use client";

import type { ReactNode } from "react";
import { CHAT_PANEL_OFFSET } from "@/core/copilot/client/config";
import { useCopilotUi } from "@/core/copilot/client/store";
import { ActivityTicker } from "@/core/copilot/client/ui/activity-ticker";
import { NetworkOverlay } from "@/core/copilot/client/ui/network-overlay";
import { cn } from "@/frontend/lib/utils";

/**
 * Makes room for the chat panel instead of letting it sit on top of the
 * console. From `md` up the panel is a side rail, so the shell reserves its
 * width; on phones it stays a full-width overlay.
 *
 * Also hosts the two console-wide surfaces the copilot drives: the contractor
 * network overlay and the agent's activity ticker. Both live here rather than
 * in the page so they survive navigation and inherit the panel offset.
 */
export function AppShell({ children }: { children: ReactNode }) {
    const { state } = useCopilotUi();
    return (
        <div
            className={cn(
                "flex min-h-svh flex-col transition-[padding] duration-200 ease-out",
                state.chatOpen && CHAT_PANEL_OFFSET,
            )}
        >
            <div className="flex-1">{children}</div>
            <ActivityTicker />
            <NetworkOverlay />
        </div>
    );
}
