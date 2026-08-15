import { describe, expect, it } from "vitest";
import { tracePath } from "@/core/copilot/client/tools/graph-path";
import type { GraphEdge } from "@/core/finding/domain/types";

/** Minimal edge factory — only the fields tracePath reads plus schema shape. */
function edge(
    fromNit: string,
    toNit: string,
    relation: string,
    id = `${fromNit}-${toNit}`,
): GraphEdge {
    return {
        id,
        watchlistId: "w1",
        findingId: null,
        fromNit,
        toNit,
        relation,
        createdAt: "2026-08-15T00:00:00.000Z",
    };
}

describe("tracePath", () => {
    const edges = [
        edge("A", "B", "socio"),
        edge("B", "C", "contrato"),
        edge("C", "D", "representante"),
        edge("E", "F", "socio"),
    ];

    it("finds a direct edge", () => {
        const out = tracePath(edges, "A", "B");
        expect("path" in out && out.path.map((e) => e.id)).toEqual(["A-B"]);
    });

    it("finds a multi-hop shortest path", () => {
        const out = tracePath(edges, "A", "D");
        expect("path" in out && out.path.map((e) => e.relation)).toEqual([
            "socio",
            "contrato",
            "representante",
        ]);
    });

    it("traverses edges regardless of direction", () => {
        const out = tracePath(edges, "D", "A");
        expect("path" in out && out.path.map((e) => e.fromNit)).toHaveLength(3);
    });

    it("errors when the two NITs are in disconnected components", () => {
        const out = tracePath(edges, "A", "F");
        expect(out).toEqual({ error: "sin conexión encontrada" });
    });

    it("errors when a NIT is absent from the graph", () => {
        const out = tracePath(edges, "A", "Z");
        expect(out).toEqual({ error: "sin conexión encontrada" });
    });

    it("errors when from and to are the same NIT", () => {
        const out = tracePath(edges, "A", "A");
        expect(out).toEqual({ error: "sin conexión encontrada" });
    });

    it("errors on an empty graph", () => {
        expect(tracePath([], "A", "B")).toEqual({
            error: "sin conexión encontrada",
        });
    });
});
