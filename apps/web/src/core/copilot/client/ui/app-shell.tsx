"use client";

import type { ReactNode } from "react";
import { CHAT_PANEL_OFFSET } from "@/core/copilot/client/config";
import { useCopilotUi } from "@/core/copilot/client/store";
import { cn } from "@/frontend/lib/utils";

/**
 * Makes room for the chat panel instead of letting it sit on top of the
 * console. From `md` up the panel is a side rail, so the shell reserves its
 * width; on phones it stays a full-width overlay.
 */
export function AppShell({ children }: { children: ReactNode }) {
    const { state } = useCopilotUi();
    return (
        <div
            className={cn(
                "transition-[padding] duration-200 ease-out",
                state.chatOpen && CHAT_PANEL_OFFSET,
            )}
        >
            {children}
        </div>
    );
}
