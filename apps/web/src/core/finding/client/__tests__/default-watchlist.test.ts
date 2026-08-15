import { describe, expect, it } from "vitest";
import { pickDefaultWatchlist } from "@/core/finding/client/default-watchlist";

const watchlists = [
    { id: "w-new", name: "Antioquia salud" }, // newest, no findings yet
    { id: "w-old", name: "Bogota smoke" },
];

// The feed returns newest-first, matching findFindingsPage's default sort.
const findings = [
    { id: "f-1", watchlistId: "w-old", createdAt: "2026-08-15T13:01:00.000Z" },
    { id: "f-2", watchlistId: "w-old", createdAt: "2026-08-15T11:14:00.000Z" },
];

describe("pickDefaultWatchlist", () => {
    it("returns undefined until the watchlists load", () => {
        expect(pickDefaultWatchlist(undefined, findings)).toBeUndefined();
        expect(pickDefaultWatchlist([], findings)).toBeUndefined();
    });

    it("prefers the watchlist owning the most recent finding", () => {
        expect(pickDefaultWatchlist(watchlists, findings)).toBe("w-old");
    });

    it("ignores findings whose watchlist is gone", () => {
        const orphaned = [
            {
                id: "f-x",
                watchlistId: "w-deleted",
                createdAt: "2026-08-15T14:00:00.000Z",
            },
            ...findings,
        ];
        expect(pickDefaultWatchlist(watchlists, orphaned)).toBe("w-old");
    });

    it("falls back to the first watchlist when no findings exist", () => {
        expect(pickDefaultWatchlist(watchlists, [])).toBe("w-new");
        expect(pickDefaultWatchlist(watchlists, undefined)).toBe("w-new");
    });

    it("does not assume the feed is sorted", () => {
        const unsorted = [
            {
                id: "f-old",
                watchlistId: "w-new",
                createdAt: "2026-08-01T00:00:00.000Z",
            },
            {
                id: "f-new",
                watchlistId: "w-old",
                createdAt: "2026-08-15T13:01:00.000Z",
            },
        ];
        expect(pickDefaultWatchlist(watchlists, unsorted)).toBe("w-old");
    });
});
