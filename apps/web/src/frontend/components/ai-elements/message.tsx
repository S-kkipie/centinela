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

/**
 * Assistant bubble stand-in while the model works. Centinela's answers take
 * several seconds (nine sources, tool calls), so an empty thread reads as a
 * dead panel — this keeps the wait legible.
 */
export function MessageThinking({ label }: { label: string }) {
    return (
        <div className="flex w-full justify-start">
            <div className="flex items-center gap-2 rounded-[var(--radius)] border border-rule bg-panel px-3 py-2">
                <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((i) => (
                        <span
                            className="size-1.5 animate-bounce rounded-full bg-signal motion-reduce:animate-none"
                            key={i}
                            style={{ animationDelay: `${i * 140}ms` }}
                        />
                    ))}
                </span>
                <span className="label-ops text-muted-foreground">{label}</span>
            </div>
        </div>
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
