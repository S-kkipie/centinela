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

export type CopilotUiState = {
    /** null = copilot is not overriding the feed's own filters. */
    findingFilter: FindingFilter | null;
    /** Feed scroll/flash target. */
    focusFindingId: string | null;
    /** Contractor-graph center/highlight target. */
    focusNit: string | null;
};

export const initialCopilotUiState: CopilotUiState = {
    findingFilter: null,
    focusFindingId: null,
    focusNit: null,
};

export type CopilotUiAction =
    | { type: "setFindingFilter"; filter: FindingFilter | null }
    | { type: "focusFinding"; findingId: string | null }
    | { type: "focusNit"; nit: string | null };

export function copilotUiReducer(
    state: CopilotUiState,
    action: CopilotUiAction,
): CopilotUiState {
    switch (action.type) {
        case "setFindingFilter":
            return { ...state, findingFilter: action.filter };
        case "focusFinding":
            return { ...state, focusFindingId: action.findingId };
        case "focusNit":
            return { ...state, focusNit: action.nit };
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
};

const CopilotUiContext = createContext<CopilotUiApi | null>(null);

export function CopilotUiProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(
        copilotUiReducer,
        initialCopilotUiState,
    );
    const api = useMemo<CopilotUiApi>(
        () => ({
            state,
            setFindingFilter: (filter) =>
                dispatch({ type: "setFindingFilter", filter }),
            focusFinding: (findingId) =>
                dispatch({ type: "focusFinding", findingId }),
            focusNit: (nit) => dispatch({ type: "focusNit", nit }),
        }),
        [state],
    );
    return createElement(CopilotUiContext.Provider, { value: api }, children);
}

export function useCopilotUi(): CopilotUiApi {
    const ctx = useContext(CopilotUiContext);
    if (!ctx)
        throw new Error("useCopilotUi requires <CopilotUiProvider> above it");
    return ctx;
}
