import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repository/find-findings-page", () => ({
    findFindingsPage: vi.fn(),
}));
vi.mock("../../repository/find-graph-edges", () => ({
    findGraphEdges: vi.fn(),
}));

import type { FindingSearch } from "@/core/finding/domain/types";
import { findFindingsPage } from "../../repository/find-findings-page";
import { findGraphEdges } from "../../repository/find-graph-edges";
import { getGraphService } from "../get-graph-service";
import { searchFindingsService } from "../search-findings-service";

const findingRow = {
    id: "f1",
    watchlistId: "w1",
    tenderId: "t1",
    entityId: "900123456",
    entityName: "Alcaldía",
    kind: "BANDERA_ROJA" as const,
    score: 90,
    title: "T",
    summary: "S",
    evidence: [{ source: "rues", claim: "c" }],
    raw: null,
    createdAt: new Date("2026-08-15T00:00:00.000Z"),
    updatedAt: new Date("2026-08-15T00:00:00.000Z"),
};

const edgeRow = {
    id: "e1",
    watchlistId: "w1",
    findingId: "f1",
    fromNit: "900123456",
    toNit: "800987654",
    relation: "shared_legal_rep",
    createdAt: new Date("2026-08-15T00:00:00.000Z"),
};

const search: FindingSearch = {
    page: 1,
    perPage: 2,
    sort: [],
    kind: [],
    watchlistId: "",
};

describe("searchFindingsService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("maps rows to the wire shape and computes pageCount", async () => {
        vi.mocked(findFindingsPage).mockResolvedValue({
            rows: [findingRow],
            total: 5,
        });
        const r = await searchFindingsService("u1", search);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.items).toHaveLength(1);
            expect(r.data.items[0].createdAt).toBe("2026-08-15T00:00:00.000Z");
            expect(r.data.items[0]).not.toHaveProperty("raw");
            expect(r.data.pageCount).toBe(3);
        }
    });

    it("returns INTERNAL_SERVER_ERROR when the repository throws", async () => {
        vi.mocked(findFindingsPage).mockRejectedValue(new Error("db down"));
        const r = await searchFindingsService("u1", search);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
});

describe("getGraphService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("maps edge rows to the wire shape", async () => {
        vi.mocked(findGraphEdges).mockResolvedValue([edgeRow]);
        const r = await getGraphService("u1", "w1");
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.edges).toHaveLength(1);
            expect(r.data.edges[0].fromNit).toBe("900123456");
            expect(r.data.edges[0].createdAt).toBe("2026-08-15T00:00:00.000Z");
        }
    });
});
