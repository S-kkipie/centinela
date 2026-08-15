import { describe, expect, it } from "vitest";
import { summarizeGraph } from "@/core/copilot/client/context/graph-summary";

const edges = [
    {
        fromNit: "900123456",
        toNit: "899999061",
        relation: "adjudicatario",
        findingId: "f-red",
    },
    {
        fromNit: "79123456",
        toNit: "900123456",
        relation: "representante_legal",
        findingId: "f-red",
    },
    {
        fromNit: "52329865",
        toNit: "899999061",
        relation: "adjudicatario",
        findingId: "f-ok",
    },
];

const names = { "899999061": "Alcaldía Mayor de Bogotá" };

describe("summarizeGraph", () => {
    it("reports an empty network without inventing nodes", () => {
        const s = summarizeGraph([], { flaggedFindingIds: new Set() });
        expect(s.totalNits).toBe(0);
        expect(s.totalEdges).toBe(0);
        expect(s.nits).toEqual([]);
    });

    it("counts deduped NITs and edges", () => {
        const s = summarizeGraph(edges, { flaggedFindingIds: new Set() });
        expect(s.totalEdges).toBe(3);
        expect(s.totalNits).toBe(4); // 899999061, 900123456, 79123456, 52329865
    });

    it("tallies relation kinds", () => {
        const s = summarizeGraph(edges, { flaggedFindingIds: new Set() });
        expect(s.relations).toEqual({
            adjudicatario: 2,
            representante_legal: 1,
        });
    });

    it("ranks NITs by degree and labels known entities", () => {
        const s = summarizeGraph(edges, {
            flaggedFindingIds: new Set(),
            entityNames: names,
        });
        expect(s.nits[0]).toMatchObject({
            nit: "899999061",
            degree: 2,
            name: "Alcaldía Mayor de Bogotá",
        });
        expect(s.nits.find((n) => n.nit === "79123456")?.name).toBeUndefined();
    });

    it("marks NITs touched by a red-flag finding", () => {
        const s = summarizeGraph(edges, {
            flaggedFindingIds: new Set(["f-red"]),
        });
        const flagged = s.nits.filter((n) => n.flagged).map((n) => n.nit);
        expect(flagged.sort()).toEqual(
            ["899999061", "900123456", "79123456"].sort(),
        );
        expect(s.nits.find((n) => n.nit === "52329865")?.flagged).toBe(false);
    });

    it("separates the watched entity from its counterparties", () => {
        const s = summarizeGraph(edges, {
            flaggedFindingIds: new Set(),
            entityNames: names,
        });
        // The watched entity is the hub by construction — every contract it
        // awards touches it — so concentration must be judged among the rest.
        expect(s.nits.find((n) => n.nit === "899999061")?.watched).toBe(true);
        expect(s.nits.find((n) => n.nit === "900123456")?.watched).toBe(false);
        expect(s.topCounterparty).toMatchObject({
            nit: "900123456",
            degree: 2,
        });
    });

    it("has no top counterparty when only the watched entity has edges", () => {
        const s = summarizeGraph([], {
            flaggedFindingIds: new Set(),
            entityNames: names,
        });
        expect(s.topCounterparty).toBeNull();
    });

    it("caps the edge list so the prompt stays small", () => {
        const many = Array.from({ length: 200 }, (_, i) => ({
            fromNit: `nit-${i}`,
            toNit: "899999061",
            relation: "adjudicatario",
            findingId: null,
        }));
        const s = summarizeGraph(many, { flaggedFindingIds: new Set() });
        expect(s.totalEdges).toBe(200);
        expect(s.edges.length).toBeLessThanOrEqual(60);
        expect(s.truncated).toBe(true);
    });
});
