import { describe, expect, it } from "vitest";
import {
    copilotUiReducer,
    initialCopilotUiState,
} from "@/core/copilot/client/store";

describe("copilotUiReducer", () => {
    it("starts with no overrides and the chat panel open", () => {
        expect(initialCopilotUiState).toEqual({
            findingFilter: null,
            focusFindingId: null,
            focusNit: null,
            chatOpen: true,
            selectedWatchlistId: null,
        });
    });

    it("tracks the watchlist the Panel is showing", () => {
        const next = copilotUiReducer(initialCopilotUiState, {
            type: "setSelectedWatchlist",
            watchlistId: "w-1",
        });
        expect(next.selectedWatchlistId).toBe("w-1");
        expect(
            copilotUiReducer(next, {
                type: "setSelectedWatchlist",
                watchlistId: null,
            }).selectedWatchlistId,
        ).toBeNull();
    });

    it("toggles the chat panel without touching commands", () => {
        const filtered = copilotUiReducer(initialCopilotUiState, {
            type: "setFindingFilter",
            filter: { kind: "OPORTUNIDAD" },
        });
        const closed = copilotUiReducer(filtered, {
            type: "setChatOpen",
            open: false,
        });
        expect(closed.chatOpen).toBe(false);
        expect(closed.findingFilter).toEqual({ kind: "OPORTUNIDAD" });
        expect(
            copilotUiReducer(closed, { type: "setChatOpen", open: true })
                .chatOpen,
        ).toBe(true);
    });

    it("sets a finding filter", () => {
        const next = copilotUiReducer(initialCopilotUiState, {
            type: "setFindingFilter",
            filter: { kind: "BANDERA_ROJA", sinceDays: 7 },
        });
        expect(next.findingFilter).toEqual({
            kind: "BANDERA_ROJA",
            sinceDays: 7,
        });
    });

    it("clears the finding filter with null", () => {
        const filtered = copilotUiReducer(initialCopilotUiState, {
            type: "setFindingFilter",
            filter: { kind: "OPORTUNIDAD" },
        });
        const cleared = copilotUiReducer(filtered, {
            type: "setFindingFilter",
            filter: null,
        });
        expect(cleared.findingFilter).toBeNull();
    });

    it("focuses a finding without touching the filter", () => {
        const filtered = copilotUiReducer(initialCopilotUiState, {
            type: "setFindingFilter",
            filter: { entityQuery: "salud" },
        });
        const focused = copilotUiReducer(filtered, {
            type: "focusFinding",
            findingId: "f-123",
        });
        expect(focused.focusFindingId).toBe("f-123");
        expect(focused.findingFilter).toEqual({ entityQuery: "salud" });
    });

    it("focuses and clears a graph NIT", () => {
        const focused = copilotUiReducer(initialCopilotUiState, {
            type: "focusNit",
            nit: "890905211",
        });
        expect(focused.focusNit).toBe("890905211");
        const cleared = copilotUiReducer(focused, {
            type: "focusNit",
            nit: null,
        });
        expect(cleared.focusNit).toBeNull();
    });
});

describe("applyFindingFilter", () => {
    const base = {
        id: "f-1",
        entityName: "Secretaría de Salud de Bogotá",
        kind: "BANDERA_ROJA" as const,
        createdAt: "2026-08-14T00:00:00.000Z",
    };
    const old = {
        ...base,
        id: "f-2",
        kind: "OPORTUNIDAD" as const,
        createdAt: "2026-07-01T00:00:00.000Z",
    };

    it("passes everything through with a null filter", async () => {
        const { applyFindingFilter } = await import(
            "@/core/copilot/client/store"
        );
        expect(applyFindingFilter([base, old], null)).toHaveLength(2);
    });

    it("filters by watchlistId when items carry one", async () => {
        const { applyFindingFilter } = await import(
            "@/core/copilot/client/store"
        );
        const a = { ...base, watchlistId: "w-1" };
        const b = { ...old, watchlistId: "w-2" };
        const out = applyFindingFilter([a, b], { watchlistId: "w-2" });
        expect(out.map((f) => f.id)).toEqual(["f-2"]);
    });

    it("filters by kind, entity substring and recency", async () => {
        const { applyFindingFilter } = await import(
            "@/core/copilot/client/store"
        );
        const now = new Date("2026-08-15T12:00:00.000Z");
        const out = applyFindingFilter(
            [base, old],
            { kind: "BANDERA_ROJA", entityQuery: "salud", sinceDays: 7 },
            now,
        );
        expect(out.map((f) => f.id)).toEqual(["f-1"]);
    });
});
