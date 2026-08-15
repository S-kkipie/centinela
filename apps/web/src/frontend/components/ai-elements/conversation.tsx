"use client";

import type { ComponentProps } from "react";
import { cn } from "@/frontend/lib/utils";

/**
 * Minimal AI-Elements-style chat primitives, hand-authored against the app's
 * "intel" dark-ops tokens instead of the shadcn registry (kept offline + fully
 * themed). The scroll container owns overflow; the panel handles stick-to-bottom.
 */

export function Conversation({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            className={cn("relative flex-1 overflow-y-auto", className)}
            {...props}
        />
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
