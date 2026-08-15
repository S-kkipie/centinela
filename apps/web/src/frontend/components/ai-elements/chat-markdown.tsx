"use client";

import { Streamdown } from "streamdown";
import { cn } from "@/frontend/lib/utils";

/**
 * Renders the assistant's markdown — headings, bold, lists, links, code — with
 * Streamdown, which tolerates the half-written markdown that streams in mid-token
 * (an unclosed **bold** or ``` fence renders cleanly instead of leaking syntax).
 *
 * Styling is tightened to the chat bubble: no oversized prose margins, links in
 * the signal color, code in the mono register.
 */
export function ChatMarkdown({ children }: { children: string }) {
    return (
        <Streamdown
            className={cn(
                "text-sm leading-relaxed",
                // Tight vertical rhythm inside the bubble.
                "[&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0",
                "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4",
                "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4",
                "[&_li]:my-0.5",
                "[&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:font-display [&_h1]:font-semibold [&_h1]:text-base",
                "[&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-sm",
                "[&_h3]:mt-1.5 [&_h3]:mb-0.5 [&_h3]:label-ops [&_h3]:text-muted-foreground",
                "[&_strong]:font-semibold [&_strong]:text-foreground",
                "[&_a]:text-signal [&_a]:underline [&_a]:decoration-rule [&_a]:underline-offset-2",
                "[&_code]:rounded-sm [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
                "[&_pre]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-rule [&_pre]:bg-background [&_pre]:p-2.5",
                "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                "[&_table]:my-1.5 [&_table]:block [&_table]:overflow-x-auto",
                "[&_th]:border [&_th]:border-rule [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
                "[&_td]:border [&_td]:border-rule [&_td]:px-2 [&_td]:py-1",
                "[&_blockquote]:border-rule [&_blockquote]:border-l-2 [&_blockquote]:pl-2.5 [&_blockquote]:text-muted-foreground",
            )}
        >
            {children}
        </Streamdown>
    );
}
