"use client";

import type { ComponentProps } from "react";
import { cn } from "@/frontend/lib/utils";

type MessageRole = "user" | "assistant";

export function Message({
    from,
    className,
    ...props
}: ComponentProps<"div"> & { from: MessageRole }) {
    return (
        <div
            className={cn(
                "flex w-full",
                from === "user" ? "justify-end" : "justify-start",
                className,
            )}
            data-role={from}
            {...props}
        />
    );
}

export function MessageContent({
    from,
    className,
    ...props
}: ComponentProps<"div"> & { from: MessageRole }) {
    return (
        <div
            className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-[var(--radius)] px-3 py-2 text-sm leading-relaxed",
                from === "user"
                    ? "bg-signal-soft text-foreground"
                    : "border border-rule bg-panel text-foreground",
                className,
            )}
            {...props}
        />
    );
}
