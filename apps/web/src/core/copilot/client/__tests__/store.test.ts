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
            selectedFindingId: null,
            networkOpen: false,
            networkFindingId: null,
            reveal: null,
            activity: [],
            briefingAt: null,
        });
    });

    // Components publish their selection from an effect. If a no-op dispatch
    // produced a fresh state object, that effect would re-fire forever.
    it("returns the same state for a no-op update", () => {
        const s = copilotUiReducer(initialCopilotUiState, {
            type: "setSelectedFinding",
            findingId: "f-1",
        });
        expect(
            copilotUiReducer(s, {
                type: "setSelectedFinding",
                findingId: "f-1",
            }),
        ).toBe(s);
        expect(
            copilotUiReducer(s, {
                type: "setSelectedWatchlist",
                watchlistId: null,
            }),
        ).toBe(s);
        expect(copilotUiReducer(s, { type: "setChatOpen", open: true })).toBe(
            s,
        );
        expect(copilotUiReducer(s, { type: "focusNit", nit: null })).toBe(s);
        expect(
            copilotUiReducer(s, { type: "focusFinding", findingId: null }),
        ).toBe(s);
    });

    it("still returns a new state when the value changes", () => {
        const s = copilotUiReducer(initialCopilotUiState, {
            type: "setSelectedFinding",
            findingId: "f-1",
        });
        expect(s).not.toBe(initialCopilotUiState);
        expect(
            copilotUiReducer(s, {
                type: "setSelectedFinding",
                findingId: "f-2",
            }),
        ).not.toBe(s);
    });

    it("tracks the finding open in the Informe", () => {
        const next = copilotUiReducer(initialCopilotUiState, {
            type: "setSelectedFinding",
            findingId: "f-7",
        });
        expect(next.selectedFindingId).toBe("f-7");
        expect(next.focusFindingId).toBeNull(); // selection ≠ copilot command
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

describe("copilotUiReducer · network overlay", () => {
    it("opens centred on a NIT and scoped to a finding", () => {
        const next = copilotUiReducer(initialCopilotUiState, {
            type: "openNetwork",
            nit: "900111",
            findingId: "f-3",
        });
        expect(next.networkOpen).toBe(true);
        expect(next.focusNit).toBe("900111");
        expect(next.networkFindingId).toBe("f-3");
    });

    // "Open the network" with no argument must not wipe an existing highlight.
    it("keeps the current highlight when no NIT is given", () => {
        const focused = copilotUiReducer(initialCopilotUiState, {
            type: "focusNit",
            nit: "900111",
        });
        const opened = copilotUiReducer(focused, { type: "openNetwork" });
        expect(opened.focusNit).toBe("900111");
        expect(opened.networkFindingId).toBeNull();
    });

    it("clears the finding scope on close and is a no-op when already closed", () => {
        const opened = copilotUiReducer(initialCopilotUiState, {
            type: "openNetwork",
            findingId: "f-3",
        });
        const closed = copilotUiReducer(opened, { type: "closeNetwork" });
        expect(closed.networkOpen).toBe(false);
        expect(closed.networkFindingId).toBeNull();
        expect(copilotUiReducer(closed, { type: "closeNetwork" })).toBe(closed);
    });
});

describe("copilotUiReducer · reveal", () => {
    it("stamps a nonce so the same command twice still moves the page", () => {
        const first = copilotUiReducer(initialCopilotUiState, {
            type: "reveal",
            target: "inbox",
            reason: "Filtro aplicado",
        });
        const second = copilotUiReducer(first, {
            type: "reveal",
            target: "inbox",
            reason: "Filtro aplicado",
        });
        expect(first.reveal?.nonce).toBe(1);
        expect(second.reveal?.nonce).toBe(2);
    });

    it("consumes only the command it was issued for", () => {
        const first = copilotUiReducer(initialCopilotUiState, {
            type: "reveal",
            target: "inbox",
            reason: "a",
        });
        const second = copilotUiReducer(first, {
            type: "reveal",
            target: "red",
            reason: "b",
        });
        // A late consume for the previous nonce must not drop the new command.
        const stale = copilotUiReducer(second, {
            type: "consumeReveal",
            nonce: 1,
        });
        expect(stale.reveal?.target).toBe("red");
        expect(
            copilotUiReducer(stale, { type: "consumeReveal", nonce: 2 }).reveal,
        ).toBeNull();
    });
});

describe("copilotUiReducer · activity log", () => {
    const entry = (id: string) => ({
        id,
        at: "2026-08-15T12:00:00.000Z",
        text: `evento ${id}`,
        kind: "barrido" as const,
    });

    it("prepends, newest first", () => {
        const one = copilotUiReducer(initialCopilotUiState, {
            type: "pushActivity",
            entry: entry("a"),
        });
        const two = copilotUiReducer(one, {
            type: "pushActivity",
            entry: entry("b"),
        });
        expect(two.activity.map((e) => e.id)).toEqual(["b", "a"]);
    });

    it("caps the log so a long session cannot grow unbounded", async () => {
        const { MAX_ACTIVITY } = await import("@/core/copilot/client/store");
        let state = initialCopilotUiState;
        for (let i = 0; i < MAX_ACTIVITY + 10; i++) {
            state = copilotUiReducer(state, {
                type: "pushActivity",
                entry: entry(`e-${i}`),
            });
        }
        expect(state.activity).toHaveLength(MAX_ACTIVITY);
        expect(state.activity[0].id).toBe(`e-${MAX_ACTIVITY + 9}`);
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
