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
