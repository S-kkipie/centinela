import { describe, expect, it } from "vitest";
import {
    addWatchlistEntitySchema,
    createWatchlistSchema,
    updateWatchlistSchema,
    watchlistEntitySchema,
    watchlistSchema,
} from "../schemas";

describe("createWatchlistSchema", () => {
    it("accepts a name", () => {
        expect(createWatchlistSchema.parse({ name: "Bogotá" }).name).toBe(
            "Bogotá",
        );
    });

    it("trims a padded name", () => {
        expect(createWatchlistSchema.parse({ name: "  Bogotá  " }).name).toBe(
            "Bogotá",
        );
    });

    it("rejects an empty name", () => {
        expect(createWatchlistSchema.safeParse({ name: "" }).success).toBe(
            false,
        );
    });
});

describe("updateWatchlistSchema", () => {
    it("allows a partial update", () => {
        expect(updateWatchlistSchema.safeParse({ name: "New" }).success).toBe(
            true,
        );
    });
});

describe("addWatchlistEntitySchema", () => {
    it("requires nit and name", () => {
        const parsed = addWatchlistEntitySchema.parse({
            nit: "900123456",
            name: "Alcaldía",
        });
        expect(parsed.nit).toBe("900123456");
    });

    it("rejects an empty nit", () => {
        expect(
            addWatchlistEntitySchema.safeParse({ nit: "", name: "x" }).success,
        ).toBe(false);
    });
});

describe("watchlistSchema", () => {
    it("requires ISO string timestamps", () => {
        const ok = watchlistSchema.safeParse({
            id: "w1",
            userId: "u1",
            name: "A",
            createdAt: "2026-08-15T00:00:00.000Z",
            updatedAt: "2026-08-15T00:00:00.000Z",
        });
        expect(ok.success).toBe(true);
    });
});

describe("watchlistEntitySchema", () => {
    it("accepts a valid entity", () => {
        const ok = watchlistEntitySchema.safeParse({
            id: "e1",
            watchlistId: "w1",
            nit: "900123456",
            name: "Alcaldía",
            createdAt: "2026-08-15T00:00:00.000Z",
        });
        expect(ok.success).toBe(true);
    });
});
