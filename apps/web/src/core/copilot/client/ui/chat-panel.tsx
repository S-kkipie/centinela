"use client";

import {
    UseAgentUpdate,
    useAgent,
    useCopilotKit,
    useRenderToolCall,
} from "@copilotkit/react-core/v2";
import { MessageSquareIcon, XIcon } from "lucide-react";
import { type FormEvent, Fragment, useEffect, useRef, useState } from "react";
import {
    CHAT_LABELS,
    CHAT_PANEL_WIDTH,
    SEED_SUGGESTIONS,
} from "@/core/copilot/client/config";
import { useCopilotUi } from "@/core/copilot/client/store";
import { useCentinelaCopilot } from "@/core/copilot/client/use-centinela-copilot";
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
} from "@/frontend/components/ai-elements/conversation";
import {
    Message,
    MessageContent,
} from "@/frontend/components/ai-elements/message";
import {
    PromptInput,
    PromptInputSubmit,
    PromptInputTextarea,
} from "@/frontend/components/ai-elements/prompt-input";
import {
    Suggestion,
    Suggestions,
} from "@/frontend/components/ai-elements/suggestion";
import { cn } from "@/frontend/lib/utils";

/** Raw AG-UI shapes we read for generative-UI rendering. */
type RawToolCall = { id: string; function: { name: string } };
type RawMessage = {
    id: string;
    role: string;
    content?: unknown;
    toolCalls?: RawToolCall[];
    toolCallId?: string;
};

/**
 * Custom right-side copilot panel. Uses CopilotKit v2 headless hooks (`useAgent`
 * for the message thread + run state, `useRenderToolCall` so every workstream's
 * tool cards render inline) over hand-built AI-Elements primitives styled with
 * the dark-ops tokens. No CopilotKit prebuilt UI.
 */
export function ChatPanel() {
    // Single mount point for all copilot context + tools (WS-B/WS-C append here).
    useCentinelaCopilot();

    const { copilotkit } = useCopilotKit();
    const { agent } = useAgent({
        updates: [
            UseAgentUpdate.OnMessagesChanged,
            UseAgentUpdate.OnRunStatusChanged,
        ],
    });
    const renderToolCall = useRenderToolCall();

    // Open state lives in the store so AppShell can reserve the panel's width.
    const { state, setChatOpen } = useCopilotUi();
    const open = state.chatOpen;
    const [draft, setDraft] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const messages = agent.messages as unknown as RawMessage[];
    const running = agent.isRunning;

    // Stick to bottom as the thread grows / streams.
    // biome-ignore lint/correctness/useExhaustiveDependencies: length + running drive scroll
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length, running, open]);

    function send(text: string) {
        const content = text.trim();
        if (!content || running) return;
        agent.addMessage({ id: crypto.randomUUID(), role: "user", content });
        setDraft("");
        // Run through the core, not the raw AG-UI agent — the core is what
        // attaches registered frontend tools and useAgentContext entries.
        void copilotkit.runAgent({ agent });
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        send(draft);
    }

    const isEmpty = !messages.some(
        (m) => m.role === "user" || m.role === "assistant",
    );

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setChatOpen(true)}
                aria-label={CHAT_LABELS.open}
                className="fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full bg-signal text-background shadow-lg"
            >
                <MessageSquareIcon className="size-5" />
            </button>
        );
    }

    return (
        <aside
            className={cn(
                "fixed inset-y-0 right-0 z-40 flex flex-col border-rule border-l bg-background/95 backdrop-blur",
                CHAT_PANEL_WIDTH,
            )}
        >
            <header className="flex items-center justify-between border-rule border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="label-ops text-signal">
                        {CHAT_LABELS.title}
                    </span>
                    {running && (
                        <span className="animate-pulse font-mono text-[11px] text-muted-foreground">
                            {CHAT_LABELS.thinking}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    aria-label={CHAT_LABELS.close}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                >
                    <XIcon className="size-4" />
                </button>
            </header>

            <Conversation ref={scrollRef}>
                <ConversationContent>
                    {isEmpty ? (
                        <ConversationEmptyState>
                            <p>{CHAT_LABELS.empty}</p>
                            <Suggestions className="mt-3">
                                {SEED_SUGGESTIONS.map((s) => (
                                    <Suggestion
                                        key={s}
                                        suggestion={s}
                                        onSelect={send}
                                    />
                                ))}
                            </Suggestions>
                        </ConversationEmptyState>
                    ) : (
                        messages.map((m) => {
                            if (m.role !== "user" && m.role !== "assistant") {
                                return null;
                            }
                            const text =
                                typeof m.content === "string" ? m.content : "";
                            const from =
                                m.role === "user" ? "user" : "assistant";
                            return (
                                <Fragment key={m.id}>
                                    {text && (
                                        <Message from={from}>
                                            <MessageContent from={from}>
                                                {text}
                                            </MessageContent>
                                        </Message>
                                    )}
                                    {m.toolCalls?.map((tc) => {
                                        const toolMessage = messages.find(
                                            (r) =>
                                                r.role === "tool" &&
                                                r.toolCallId === tc.id,
                                        );
                                        return (
                                            <div key={tc.id}>
                                                {renderToolCall({
                                                    toolCall: tc,
                                                    toolMessage,
                                                } as unknown as Parameters<
                                                    typeof renderToolCall
                                                >[0])}
                                            </div>
                                        );
                                    })}
                                </Fragment>
                            );
                        })
                    )}
                </ConversationContent>
            </Conversation>

            <PromptInput onSubmit={onSubmit}>
                <PromptInputTextarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onSubmit={() => send(draft)}
                    placeholder={CHAT_LABELS.placeholder}
                    disabled={running}
                />
                <PromptInputSubmit
                    label={CHAT_LABELS.send}
                    disabled={running || !draft.trim()}
                />
            </PromptInput>
        </aside>
    );
}
