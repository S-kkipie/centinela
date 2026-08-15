"use client";

import { SendHorizonalIcon } from "lucide-react";
import type { ComponentProps, FormEvent, KeyboardEvent } from "react";
import { cn } from "@/frontend/lib/utils";

export function PromptInput({
    className,
    onSubmit,
    ...props
}: Omit<ComponentProps<"form">, "onSubmit"> & {
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <form
            onSubmit={onSubmit}
            className={cn(
                "flex items-end gap-2 border-rule border-t bg-panel/60 p-3",
                className,
            )}
            {...props}
        />
    );
}

export function PromptInputTextarea({
    className,
    onSubmit,
    ...props
}: Omit<ComponentProps<"textarea">, "onSubmit"> & {
    onSubmit: () => void;
}) {
    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
        }
    }
    return (
        <textarea
            rows={1}
            onKeyDown={handleKeyDown}
            className={cn(
                "max-h-32 min-h-9 flex-1 resize-none bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground",
                className,
            )}
            {...props}
        />
    );
}

export function PromptInputSubmit({
    disabled,
    label,
    className,
    ...props
}: ComponentProps<"button"> & { label: string }) {
    return (
        <button
            type="submit"
            disabled={disabled}
            aria-label={label}
            className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-signal text-background transition-opacity disabled:opacity-40",
                className,
            )}
            {...props}
        >
            <SendHorizonalIcon className="size-4" />
        </button>
    );
}
