import { describe, expect, it, vi } from "vitest";
import {
    addEntitiesToWatchlistParams,
    canCancel,
    canConfirm,
    confirmAddEntities,
    confirmProposeWatchlist,
    confirmSummary,
    hitlReducer,
    initialHitlState,
    proposeWatchlistParams,
    toAddEntityBodies,
    toCreateWatchlistBody,
    type WatchlistWriteDeps,
} from "@/core/copilot/client/tools/watchlist-tools-core";

const proposal = {
    name: "Infraestructura Medellín",
    entities: [
        { nit: "890905211", entityName: "Alcaldía de Medellín" },
        { nit: "800000001", entityName: "EPM" },
    ],
};

function fakeDeps() {
    const createWatchlist = vi
        .fn<WatchlistWriteDeps["createWatchlist"]>()
        .mockResolvedValue({ id: "wl-1", name: "Infraestructura Medellín" });
    const addEntity = vi
        .fn<WatchlistWriteDeps["addEntity"]>()
        .mockResolvedValue(undefined);
    return { createWatchlist, addEntity } satisfies WatchlistWriteDeps;
}

describe("param schemas", () => {
    it("proposeWatchlist accepts a name + at least one entity", () => {
        expect(proposeWatchlistParams.parse(proposal)).toEqual(proposal);
    });

    it("proposeWatchlist rejects empty name and empty entity list", () => {
        expect(() =>
            proposeWatchlistParams.parse({
                name: "",
                entities: proposal.entities,
            }),
        ).toThrowError();
        expect(() =>
            proposeWatchlistParams.parse({ name: "X", entities: [] }),
        ).toThrowError();
    });

    it("proposeWatchlist rejects an entity missing its nit", () => {
        expect(() =>
            proposeWatchlistParams.parse({
                name: "X",
                entities: [{ entityName: "Sin NIT" }],
            }),
        ).toThrowError();
    });

    it("addEntitiesToWatchlist requires a watchlistId and entities", () => {
        expect(
            addEntitiesToWatchlistParams.parse({
                watchlistId: "wl-1",
                entities: proposal.entities,
            }),
        ).toMatchObject({ watchlistId: "wl-1" });
        expect(() =>
            addEntitiesToWatchlistParams.parse({ entities: proposal.entities }),
        ).toThrowError();
    });
});

describe("payload builders", () => {
    it("maps proposal name to the create body, trimming", () => {
        expect(toCreateWatchlistBody({ name: "  Bogotá salud  " })).toEqual({
            name: "Bogotá salud",
        });
    });

    it("maps entityName -> name for the addEntity mutation, trimming", () => {
        expect(
            toAddEntityBodies([
                { nit: " 890905211 ", entityName: " Alcaldía de Medellín " },
            ]),
        ).toEqual([{ nit: "890905211", name: "Alcaldía de Medellín" }]);
    });
});

describe("confirmProposeWatchlist", () => {
    it("creates the watchlist then adds every entity with the created id", async () => {
        const deps = fakeDeps();
        const result = await confirmProposeWatchlist(proposal, deps);

        expect(deps.createWatchlist).toHaveBeenCalledTimes(1);
        expect(deps.createWatchlist).toHaveBeenCalledWith({
            name: "Infraestructura Medellín",
        });
        expect(deps.addEntity).toHaveBeenCalledTimes(2);
        expect(deps.addEntity).toHaveBeenNthCalledWith(1, {
            watchlistId: "wl-1",
            body: { nit: "890905211", name: "Alcaldía de Medellín" },
        });
        expect(deps.addEntity).toHaveBeenNthCalledWith(2, {
            watchlistId: "wl-1",
            body: { nit: "800000001", name: "EPM" },
        });
        expect(result).toEqual({
            ok: true,
            watchlistId: "wl-1",
            name: "Infraestructura Medellín",
            entityCount: 2,
        });
    });

    it("returns { ok:false, error } and adds nothing when create fails", async () => {
        const deps = fakeDeps();
        deps.createWatchlist.mockRejectedValueOnce(
            new Error("create failed: 500"),
        );
        const result = await confirmProposeWatchlist(proposal, deps);

        expect(result).toEqual({ ok: false, error: "create failed: 500" });
        expect(deps.addEntity).not.toHaveBeenCalled();
    });

    it("surfaces an addEntity failure as an error", async () => {
        const deps = fakeDeps();
        deps.addEntity.mockRejectedValueOnce(
            new Error("add entity failed: 422"),
        );
        const result = await confirmProposeWatchlist(proposal, deps);
        expect(result).toEqual({ ok: false, error: "add entity failed: 422" });
    });
});

describe("confirmAddEntities", () => {
    it("adds entities to an existing watchlist without creating one", async () => {
        const deps = fakeDeps();
        const result = await confirmAddEntities(
            { watchlistId: "wl-9", entities: proposal.entities },
            deps,
        );

        expect(deps.createWatchlist).not.toHaveBeenCalled();
        expect(deps.addEntity).toHaveBeenCalledTimes(2);
        expect(deps.addEntity).toHaveBeenNthCalledWith(1, {
            watchlistId: "wl-9",
            body: { nit: "890905211", name: "Alcaldía de Medellín" },
        });
        expect(result).toMatchObject({
            ok: true,
            watchlistId: "wl-9",
            entityCount: 2,
        });
    });
});

describe("hitl state machine (confirm/cancel/pending)", () => {
    it("idle -> pending on confirm, then confirmed on resolved", () => {
        const pending = hitlReducer(initialHitlState, { type: "confirm" });
        expect(pending.phase).toBe("pending");
        expect(hitlReducer(pending, { type: "resolved" }).phase).toBe(
            "confirmed",
        );
    });

    it("ignores a second confirm while pending (idempotent double-click)", () => {
        const pending = hitlReducer(initialHitlState, { type: "confirm" });
        expect(canConfirm(pending)).toBe(false);
        expect(hitlReducer(pending, { type: "confirm" })).toBe(pending);
    });

    it("idle -> cancelled on cancel, and cancel is a no-op once pending", () => {
        const cancelled = hitlReducer(initialHitlState, { type: "cancel" });
        expect(cancelled.phase).toBe("cancelled");
        const pending = hitlReducer(initialHitlState, { type: "confirm" });
        expect(canCancel(pending)).toBe(false);
        expect(hitlReducer(pending, { type: "cancel" }).phase).toBe("pending");
    });

    it("pending -> error carries the message", () => {
        const pending = hitlReducer(initialHitlState, { type: "confirm" });
        const errored = hitlReducer(pending, {
            type: "failed",
            error: "boom",
        });
        expect(errored).toEqual({ phase: "error", error: "boom" });
    });
});

describe("confirmSummary", () => {
    it("summarizes a created watchlist with pluralized entities", () => {
        expect(
            confirmSummary({
                ok: true,
                watchlistId: "wl-1",
                name: "Infraestructura Medellín",
                entityCount: 2,
            }),
        ).toContain("Infraestructura Medellín");
    });

    it("reports the error on failure", () => {
        expect(confirmSummary({ ok: false, error: "boom" })).toContain("boom");
    });
});
