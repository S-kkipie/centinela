import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repository/find-watchlist-ids-by-entity", () => ({
    findWatchlistIdsByEntityNit: vi.fn(),
}));
vi.mock("../../repository/upsert-finding", () => ({ upsertFinding: vi.fn() }));
vi.mock("../../repository/replace-graph-edges", () => ({
    replaceGraphEdges: vi.fn(),
}));

import type { FindingIngest } from "@centinela/contracts/finding";
import { findWatchlistIdsByEntityNit } from "../../repository/find-watchlist-ids-by-entity";
import { replaceGraphEdges } from "../../repository/replace-graph-edges";
import { upsertFinding } from "../../repository/upsert-finding";
import { ingestFindingService } from "../ingest-finding-service";

const payload: FindingIngest = {
    tenderId: "t1",
    entityId: "900123456",
    entityName: "Alcaldía de Bogotá",
    kind: "BANDERA_ROJA",
    score: 90,
    title: "Adjudicación sospechosa",
    summary: "Un solo proponente.",
    evidence: [{ source: "rues-entity-by-nit", claim: "Capital insuficiente" }],
    graphEdges: [
        { from: "900123456", to: "800987654", relation: "shared_legal_rep" },
    ],
};

const findingRow = { id: "f1" };

describe("ingestFindingService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("is a no-op when no watchlist watches the entity", async () => {
        vi.mocked(findWatchlistIdsByEntityNit).mockResolvedValue([]);
        const r = await ingestFindingService(payload);
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.findingsWritten).toBe(0);
        expect(upsertFinding).not.toHaveBeenCalled();
        expect(replaceGraphEdges).not.toHaveBeenCalled();
    });

    it("upserts one finding per watching watchlist", async () => {
        vi.mocked(findWatchlistIdsByEntityNit).mockResolvedValue(["w1", "w2"]);
        vi.mocked(upsertFinding).mockResolvedValue(findingRow as never);
        const r = await ingestFindingService(payload);
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.findingsWritten).toBe(2);
        expect(upsertFinding).toHaveBeenCalledTimes(2);
    });

    it("maps contract graphEdge from/to onto fromNit/toNit", async () => {
        vi.mocked(findWatchlistIdsByEntityNit).mockResolvedValue(["w1"]);
        vi.mocked(upsertFinding).mockResolvedValue(findingRow as never);
        await ingestFindingService(payload);
        expect(replaceGraphEdges).toHaveBeenCalledWith("f1", [
            {
                watchlistId: "w1",
                findingId: "f1",
                fromNit: "900123456",
                toNit: "800987654",
                relation: "shared_legal_rep",
            },
        ]);
    });

    it("still replaces edges (clearing stale ones) when payload has none", async () => {
        vi.mocked(findWatchlistIdsByEntityNit).mockResolvedValue(["w1"]);
        vi.mocked(upsertFinding).mockResolvedValue(findingRow as never);
        await ingestFindingService({ ...payload, graphEdges: [] });
        expect(replaceGraphEdges).toHaveBeenCalledWith("f1", []);
    });

    it("returns INTERNAL_SERVER_ERROR when a repository throws", async () => {
        vi.mocked(findWatchlistIdsByEntityNit).mockRejectedValue(
            new Error("db down"),
        );
        const r = await ingestFindingService(payload);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
});
