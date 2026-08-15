"use client";

import {
    UseAgentUpdate,
    useAgent,
    useCopilotKit,
    useRenderToolCall,
    useSuggestions,
} from "@copilotkit/react-core/v2";
import { MessageSquareIcon, XIcon } from "lucide-react";
import { type FormEvent, Fragment, useEffect, useRef, useState } from "react";
import {
    CHAT_LABELS,
    CHAT_PANEL_WIDTH,
    SEED_SUGGESTIONS,
} from "@/core/copilot/client/config";
import { useCopilotUi } from "@/core/copilot/client/store";
import { dedupeSuggestions } from "@/core/copilot/client/suggestions/dedupe";
import { useCentinelaCopilot } from "@/core/copilot/client/use-centinela-copilot";
import { ChatMarkdown } from "@/frontend/components/ai-elements/chat-markdown";
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
} from "@/frontend/components/ai-elements/conversation";
import {
    Message,
    MessageContent,
    MessageThinking,
} from "@/frontend/components/ai-elements/message";
import {
    PromptInput,
    PromptInputSubmit,
    PromptInputTextarea,
} from "@/frontend/components/ai-elements/prompt-input";
import {
    Suggestion,
    SuggestionSkeleton,
    Suggestions,
} from "@/frontend/components/ai-elements/suggestion";
import { Spinner } from "@/frontend/components/ui/spinner";
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
    const { isRegenerating } = useCentinelaCopilot();

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

    // Model-written chips, with the static seeds as the cold-start fallback.
    const { suggestions } = useSuggestions();
    // Cap the row: a stale batch that slips past the clear must never turn the
    // panel into a wall of chips.
    const generated = dedupeSuggestions(
        suggestions
            .map((s) => s.title || s.message)
            .filter((s): s is string => Boolean(s)),
    ).slice(-3);
    // The loader wins over the existing chips: once the user moves, those chips
    // describe something they already left, so showing them reads as an answer
    // that never updated.
    const showSuggestionLoader = isRegenerating;
    const chips = showSuggestionLoader
        ? []
        : generated.length > 0
          ? generated
          : messages.length > 0
            ? []
            : [...SEED_SUGGESTIONS];

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
                                            <MessageContent
                                                className={
                                                    from === "assistant"
                                                        ? "whitespace-normal"
                                                        : undefined
                                                }
                                                from={from}
                                            >
                                                {from === "assistant" ? (
                                                    <ChatMarkdown>
                                                        {text}
                                                    </ChatMarkdown>
                                                ) : (
                                                    text
                                                )}
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
                    {running && !isEmpty && (
                        <MessageThinking label={CHAT_LABELS.thinking} />
                    )}
                </ConversationContent>
            </Conversation>

            {/* AI-written chips that follow whatever the user is looking at.
                They sit above the input so they stay reachable mid-thread. */}
            {!running && (showSuggestionLoader || chips.length > 0) && (
                <div className="border-rule border-t px-3 py-2">
                    {showSuggestionLoader ? (
                        <div className="space-y-1.5">
                            <span className="label-ops flex items-center gap-1.5 text-signal">
                                <Spinner className="size-3" />
                                {CHAT_LABELS.suggesting}
                            </span>
                            <SuggestionSkeleton />
                        </div>
                    ) : (
                        <Suggestions>
                            {/* The model can repeat itself, so the text alone
                                is not a stable key. */}
                            {chips.map((s, i) => (
                                <Suggestion
                                    key={`${i}-${s}`}
                                    onSelect={send}
                                    suggestion={s}
                                />
                            ))}
                        </Suggestions>
                    )}
                </div>
            )}

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
