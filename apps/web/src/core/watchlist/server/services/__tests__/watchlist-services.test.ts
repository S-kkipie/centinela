import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repository/create-watchlist", () => ({
    createWatchlist: vi.fn(),
}));
vi.mock("../../repository/find-watchlists", () => ({
    findWatchlists: vi.fn(),
}));
vi.mock("../../repository/find-watchlist-by-id", () => ({
    findWatchlistById: vi.fn(),
    findWatchlistEntities: vi.fn(),
}));
vi.mock("../../repository/delete-watchlist", () => ({
    deleteWatchlist: vi.fn(),
}));
vi.mock("../../repository/entities", () => ({
    addWatchlistEntity: vi.fn(),
    removeWatchlistEntity: vi.fn(),
}));

import { createWatchlist } from "../../repository/create-watchlist";
import { deleteWatchlist } from "../../repository/delete-watchlist";
import {
    addWatchlistEntity,
    removeWatchlistEntity,
} from "../../repository/entities";
import {
    findWatchlistById,
    findWatchlistEntities,
} from "../../repository/find-watchlist-by-id";
import { findWatchlists } from "../../repository/find-watchlists";
import { addEntityService } from "../add-entity-service";
import { createWatchlistService } from "../create-watchlist-service";
import { deleteWatchlistService } from "../delete-watchlist-service";
import { getWatchlistService } from "../get-watchlist-service";
import { listWatchlistsService } from "../list-watchlists-service";
import { removeEntityService } from "../remove-entity-service";

const wlRow = {
    id: "w1",
    userId: "u1",
    name: "Bogotá",
    createdAt: new Date("2026-08-15T00:00:00.000Z"),
    updatedAt: new Date("2026-08-15T00:00:00.000Z"),
};

const entityRow = {
    id: "e1",
    watchlistId: "w1",
    nit: "900123456",
    name: "Alcaldía",
    createdAt: new Date("2026-08-15T00:00:00.000Z"),
};

describe("createWatchlistService", () => {
    beforeEach(() => vi.clearAllMocks());
    it("returns the mapped created watchlist", async () => {
        vi.mocked(createWatchlist).mockResolvedValue(wlRow);
        const r = await createWatchlistService("u1", { name: "Bogotá" });
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.id).toBe("w1");
            expect(r.data.createdAt).toBe("2026-08-15T00:00:00.000Z");
        }
    });
});

describe("listWatchlistsService", () => {
    beforeEach(() => vi.clearAllMocks());
    it("maps rows to the wire shape", async () => {
        vi.mocked(findWatchlists).mockResolvedValue([wlRow]);
        const r = await listWatchlistsService("u1");
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data).toHaveLength(1);
    });
});

describe("getWatchlistService", () => {
    beforeEach(() => vi.clearAllMocks());
    it("returns NOT_FOUND when the watchlist is missing or foreign", async () => {
        vi.mocked(findWatchlistById).mockResolvedValue(null);
        const r = await getWatchlistService("u1", "w1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });

    it("inlines the watched entities", async () => {
        vi.mocked(findWatchlistById).mockResolvedValue(wlRow);
        vi.mocked(findWatchlistEntities).mockResolvedValue([entityRow]);
        const r = await getWatchlistService("u1", "w1");
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.entities).toHaveLength(1);
            expect(r.data.entities[0].nit).toBe("900123456");
        }
    });
});

describe("deleteWatchlistService", () => {
    beforeEach(() => vi.clearAllMocks());
    it("returns NOT_FOUND when nothing was deleted", async () => {
        vi.mocked(deleteWatchlist).mockResolvedValue(null);
        const r = await deleteWatchlistService("u1", "w1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });
});

describe("addEntityService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when the watchlist is foreign", async () => {
        vi.mocked(findWatchlistById).mockResolvedValue(null);
        const r = await addEntityService("u1", "w1", {
            nit: "900123456",
            name: "Alcaldía",
        });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
        expect(addWatchlistEntity).not.toHaveBeenCalled();
    });

    it("adds an entity to an owned watchlist", async () => {
        vi.mocked(findWatchlistById).mockResolvedValue(wlRow);
        vi.mocked(addWatchlistEntity).mockResolvedValue(entityRow);
        const r = await addEntityService("u1", "w1", {
            nit: "900123456",
            name: "Alcaldía",
        });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.nit).toBe("900123456");
    });
});

describe("removeEntityService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when the watchlist is foreign", async () => {
        vi.mocked(findWatchlistById).mockResolvedValue(null);
        const r = await removeEntityService("u1", "w1", "e1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
        expect(removeWatchlistEntity).not.toHaveBeenCalled();
    });

    it("removes an entity from an owned watchlist", async () => {
        vi.mocked(findWatchlistById).mockResolvedValue(wlRow);
        vi.mocked(removeWatchlistEntity).mockResolvedValue({ id: "e1" });
        const r = await removeEntityService("u1", "w1", "e1");
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.id).toBe("e1");
    });
});
