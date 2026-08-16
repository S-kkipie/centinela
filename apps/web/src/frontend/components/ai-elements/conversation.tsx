"use client";

import type { ComponentProps, Ref } from "react";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { cn } from "@/frontend/lib/utils";

/**
 * Minimal AI-Elements-style chat primitives, hand-authored against the app's
 * "intel" dark-ops tokens instead of the shadcn registry (kept offline + fully
 * themed). The scroll container is the shadcn ScrollArea (Radix) so the panel
 * gets the themed overlay scrollbar, never Chrome's native one; the `ref`
 * lands on the scroll viewport so the panel's stick-to-bottom keeps working.
 */

export function Conversation({
    className,
    ref,
    ...props
}: ComponentProps<"div"> & { ref?: Ref<HTMLDivElement> }) {
    return (
        <ScrollArea
            className={cn("min-h-0 flex-1", className)}
            viewportRef={ref}
        >
            <div {...props} />
        </ScrollArea>
    );
}

export function ConversationContent({
    className,
    ...props
}: ComponentProps<"div">) {
    return (
        <div
            className={cn("flex flex-col gap-4 px-4 py-4", className)}
            {...props}
        />
    );
}

export function ConversationEmptyState({
    className,
    children,
    ...props
}: ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "flex flex-col items-start gap-1 px-1 py-6 text-muted-foreground text-sm",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
