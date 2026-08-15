"use client";

import type { ComponentProps } from "react";
import { cn } from "@/frontend/lib/utils";

export function Suggestions({ className, ...props }: ComponentProps<"div">) {
    return <div className={cn("flex flex-wrap gap-2", className)} {...props} />;
}

export function Suggestion({
    suggestion,
    onSelect,
    className,
    ...props
}: Omit<ComponentProps<"button">, "onSelect"> & {
    suggestion: string;
    onSelect: (suggestion: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(suggestion)}
            className={cn(
                "rounded-[var(--radius)] border border-rule bg-panel px-2.5 py-1.5 text-left text-muted-foreground text-xs transition-colors hover:border-signal hover:text-foreground",
                className,
            )}
            {...props}
        >
            {suggestion}
        </button>
    );
}

/**
 * Placeholder chips shown while the model writes the real ones, so the row
 * doesn't collapse and reflow the panel each time the context changes.
 */
export function SuggestionSkeleton({ count = 3 }: { count?: number }) {
    const widths = ["w-28", "w-36", "w-24"];
    return (
        <div aria-hidden className="flex flex-wrap gap-2">
            {Array.from({ length: count }, (_, i) => (
                <span
                    className={cn(
                        "h-7 animate-pulse rounded-[var(--radius)] border border-rule bg-panel/60",
                        widths[i % widths.length],
                    )}
                    key={`sk-${i}`}
                />
            ))}
        </div>
    );
}
