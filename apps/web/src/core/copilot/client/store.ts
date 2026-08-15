"use client";

/**
 * Copilot UI-command store — the contract between copilot frontend tools and
 * the page components they drive. Tools dispatch here; Dashboard/FindingsFeed/
 * ContractorGraph subscribe. Orchestrator-owned: workstreams consume, never edit.
 */

import {
    createContext,
    createElement,
    type ReactNode,
    useContext,
    useMemo,
    useReducer,
} from "react";
import type { FindingKind } from "@/core/finding/domain/types";

export type FindingFilter = {
    kind?: FindingKind;
    watchlistId?: string;
    /** Case-insensitive substring match on entityName. */
    entityQuery?: string;
    /** e.g. 7 = "esta semana", measured against createdAt. */
    sinceDays?: number;
};

/**
 * Regions of the console the copilot can drive the user's eyes to. The matching
 * DOM node carries `data-reveal="<target>"`; `useRevealTarget` does the scroll.
 */
export const REVEAL_TARGETS = ["triage", "inbox", "informe", "red"] as const;
export type RevealTarget = (typeof REVEAL_TARGETS)[number];

/**
 * A scroll command with its justification. `nonce` makes repeats distinct:
 * "take me back to the inbox" twice in a row must move the page twice.
 */
export type RevealCommand = {
    target: RevealTarget;
    /** Shown in the activity ticker — the user must know why the page moved. */
    reason: string;
    nonce: number;
};

/** One line in the agent's activity log. Newest first. */
export type ActivityEntry = {
    id: string;
    at: string;
    text: string;
    kind: "barrido" | "bandera" | "copiloto";
};

/** Beyond this the ticker is scrollback nobody reads. */
export const MAX_ACTIVITY = 30;

export type CopilotUiState = {
    /** null = copilot is not overriding the feed's own filters. */
    findingFilter: FindingFilter | null;
    /** Feed scroll/flash target. */
    focusFindingId: string | null;
    /** Contractor-graph center/highlight target. */
    focusNit: string | null;
    /** Chat panel visibility — lives here so the app shell can make room. */
    chatOpen: boolean;
    /** Which watchlist the Panel is showing, so the copilot sees what you see. */
    selectedWatchlistId: string | null;
    /**
     * The finding open in the Informe. Distinct from `focusFindingId`: this is
     * what the user is looking at, that is a one-shot copilot command.
     */
    selectedFindingId: string | null;
    /**
     * The contractor network as an overlay. The full network used to live at the
     * bottom of the page, below everything — nobody scrolled that far, so the
     * copilot could never actually show it. As an overlay it needs no scroll.
     */
    networkOpen: boolean;
    /** Scopes the overlay to one finding's relations; null = the whole watchlist. */
    networkFindingId: string | null;
    /** Pending scroll command; consumed by `useRevealTarget`. */
    reveal: RevealCommand | null;
    /** What the agent has done, newest first. */
    activity: ActivityEntry[];
    /** ISO stamp of the opening briefing, so it is delivered once per session. */
    briefingAt: string | null;
};

export const initialCopilotUiState: CopilotUiState = {
    findingFilter: null,
    focusFindingId: null,
    focusNit: null,
    chatOpen: true,
    selectedWatchlistId: null,
    selectedFindingId: null,
    networkOpen: false,
    networkFindingId: null,
    reveal: null,
    activity: [],
    briefingAt: null,
};

export type CopilotUiAction =
    | { type: "setFindingFilter"; filter: FindingFilter | null }
    | { type: "focusFinding"; findingId: string | null }
    | { type: "focusNit"; nit: string | null }
    | { type: "setChatOpen"; open: boolean }
    | { type: "setSelectedWatchlist"; watchlistId: string | null }
    | { type: "setSelectedFinding"; findingId: string | null }
    | { type: "openNetwork"; nit?: string | null; findingId?: string | null }
    | { type: "closeNetwork" }
    | { type: "reveal"; target: RevealTarget; reason: string }
    | { type: "consumeReveal"; nonce: number }
    | { type: "pushActivity"; entry: ActivityEntry }
    | { type: "setBriefingAt"; at: string };

/**
 * Panels publish their selection from effects, so a no-op update MUST return
 * the identical state object — otherwise the new state re-runs the effect that
 * dispatched it and the render loop never settles.
 */
function set<K extends keyof CopilotUiState>(
    state: CopilotUiState,
    key: K,
    value: CopilotUiState[K],
): CopilotUiState {
    return state[key] === value ? state : { ...state, [key]: value };
}

export function copilotUiReducer(
    state: CopilotUiState,
    action: CopilotUiAction,
): CopilotUiState {
    switch (action.type) {
        case "setFindingFilter":
            return { ...state, findingFilter: action.filter };
        case "focusFinding":
            return set(state, "focusFindingId", action.findingId);
        case "focusNit":
            return set(state, "focusNit", action.nit);
        case "setChatOpen":
            return set(state, "chatOpen", action.open);
        case "setSelectedWatchlist":
            return set(state, "selectedWatchlistId", action.watchlistId);
        case "setSelectedFinding":
            return set(state, "selectedFindingId", action.findingId);
        case "openNetwork":
            return {
                ...state,
                networkOpen: true,
                networkFindingId: action.findingId ?? null,
                // A NIT is optional: "open the network" with no argument still
                // has to keep whatever was highlighted before.
                focusNit:
                    action.nit === undefined ? state.focusNit : action.nit,
            };
        case "closeNetwork":
            return state.networkOpen
                ? { ...state, networkOpen: false, networkFindingId: null }
                : state;
        case "reveal":
            return {
                ...state,
                reveal: {
                    target: action.target,
                    reason: action.reason,
                    nonce: (state.reveal?.nonce ?? 0) + 1,
                },
            };
        case "consumeReveal":
            // Nonce-guarded: a command issued while the previous one was being
            // consumed must survive, or the second scroll never happens.
            return state.reveal?.nonce === action.nonce
                ? { ...state, reveal: null }
                : state;
        case "pushActivity":
            return {
                ...state,
                activity: [action.entry, ...state.activity].slice(
                    0,
                    MAX_ACTIVITY,
                ),
            };
        case "setBriefingAt":
            return set(state, "briefingAt", action.at);
        default:
            return state;
    }
}

/** Minimal shape applyFindingFilter needs — Finding satisfies it. */
export type FilterableFinding = {
    id: string;
    entityName: string;
    kind: FindingKind;
    createdAt: string;
    watchlistId?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Client-side filter over the already-polled feed items. */
export function applyFindingFilter<T extends FilterableFinding>(
    items: T[],
    filter: FindingFilter | null,
    now: Date = new Date(),
): T[] {
    if (!filter) return items;
    const query = filter.entityQuery?.toLowerCase();
    const cutoff =
        filter.sinceDays != null
            ? now.getTime() - filter.sinceDays * DAY_MS
            : null;
    return items.filter((f) => {
        if (
            filter.watchlistId &&
            f.watchlistId != null &&
            f.watchlistId !== filter.watchlistId
        )
            return false;
        if (filter.kind && f.kind !== filter.kind) return false;
        if (query && !f.entityName.toLowerCase().includes(query)) return false;
        if (cutoff != null && new Date(f.createdAt).getTime() < cutoff)
            return false;
        return true;
    });
}

export type CopilotUiApi = {
    state: CopilotUiState;
    setFindingFilter(filter: FindingFilter | null): void;
    focusFinding(findingId: string | null): void;
    focusNit(nit: string | null): void;
    setChatOpen(open: boolean): void;
    setSelectedWatchlist(watchlistId: string | null): void;
    setSelectedFinding(findingId: string | null): void;
    openNetwork(opts?: {
        nit?: string | null;
        findingId?: string | null;
    }): void;
    closeNetwork(): void;
    reveal(target: RevealTarget, reason: string): void;
    consumeReveal(nonce: number): void;
    pushActivity(entry: Omit<ActivityEntry, "id" | "at">): void;
    setBriefingAt(at: string): void;
};

const CopilotUiContext = createContext<CopilotUiApi | null>(null);

export function CopilotUiProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(
        copilotUiReducer,
        initialCopilotUiState,
    );
    // Setter identities must NOT change with state: components publish their
    // selection from effects that depend on these, and a new identity on every
    // state change would re-fire them in a loop. `dispatch` is already stable.
    const actions = useMemo(
        () => ({
            setFindingFilter: (filter: FindingFilter | null) =>
                dispatch({ type: "setFindingFilter", filter }),
            focusFinding: (findingId: string | null) =>
                dispatch({ type: "focusFinding", findingId }),
            focusNit: (nit: string | null) =>
                dispatch({ type: "focusNit", nit }),
            setChatOpen: (open: boolean) =>
                dispatch({ type: "setChatOpen", open }),
            setSelectedWatchlist: (watchlistId: string | null) =>
                dispatch({ type: "setSelectedWatchlist", watchlistId }),
            setSelectedFinding: (findingId: string | null) =>
                dispatch({ type: "setSelectedFinding", findingId }),
            openNetwork: (opts?: {
                nit?: string | null;
                findingId?: string | null;
            }) => dispatch({ type: "openNetwork", ...opts }),
            closeNetwork: () => dispatch({ type: "closeNetwork" }),
            reveal: (target: RevealTarget, reason: string) =>
                dispatch({ type: "reveal", target, reason }),
            consumeReveal: (nonce: number) =>
                dispatch({ type: "consumeReveal", nonce }),
            pushActivity: (entry: Omit<ActivityEntry, "id" | "at">) =>
                dispatch({
                    type: "pushActivity",
                    entry: {
                        ...entry,
                        id: crypto.randomUUID(),
                        at: new Date().toISOString(),
                    },
                }),
            setBriefingAt: (at: string) =>
                dispatch({ type: "setBriefingAt", at }),
        }),
        [],
    );
    const api = useMemo<CopilotUiApi>(
        () => ({ state, ...actions }),
        [state, actions],
    );
    return createElement(CopilotUiContext.Provider, { value: api }, children);
}

export function useCopilotUi(): CopilotUiApi {
    const ctx = useContext(CopilotUiContext);
    if (!ctx)
        throw new Error("useCopilotUi requires <CopilotUiProvider> above it");
    return ctx;
}

/** Null outside the provider — for components that must render standalone. */
export function useCopilotUiOptional(): CopilotUiApi | null {
    return useContext(CopilotUiContext);
}
