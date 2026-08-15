import { describe, expect, it } from "vitest";
import {
    buildNodeMeta,
    describeNode,
    type GraphEdgeLike,
} from "@/core/finding/client/ui/graph-node-meta";

const ENTITY = "899999061";

function award(winner: string, findingId?: string): GraphEdgeLike {
    return {
        fromNit: ENTITY,
        toNit: winner,
        relation: "adjudicatario",
        findingId: findingId ?? null,
    };
}

const watchedNits = new Set([ENTITY]);

describe("buildNodeMeta", () => {
    it("labels the watched entity and the winner", () => {
        const m = buildNodeMeta([award("900111")], {
            watchedNits,
            nameByNit: { [ENTITY]: "Alcaldía de Bogotá" },
        });
        expect(m.get(ENTITY)?.role).toBe("vigilada");
        expect(m.get(ENTITY)?.name).toBe("Alcaldía de Bogotá");
        expect(m.get("900111")?.role).toBe("adjudicatario");
    });

    // Orientation isn't guaranteed, so the winner is whichever endpoint isn't
    // the watched entity, regardless of from/to.
    it("finds the winner when the edge is reversed", () => {
        const m = buildNodeMeta(
            [{ fromNit: "900222", toNit: ENTITY, relation: "adjudicatario" }],
            { watchedNits },
        );
        expect(m.get("900222")?.role).toBe("adjudicatario");
        expect(m.get(ENTITY)?.role).toBe("vigilada");
    });

    it("labels a legal representative", () => {
        const m = buildNodeMeta(
            [
                award("900111"),
                {
                    fromNit: "CC-79",
                    toNit: "900111",
                    relation: "representante_legal",
                },
            ],
            { watchedNits },
        );
        expect(m.get("CC-79")?.role).toBe("representante");
    });

    it("counts degree and records links both ways", () => {
        const m = buildNodeMeta([award("900111"), award("900222")], {
            watchedNits,
        });
        expect(m.get(ENTITY)?.degree).toBe(2);
        expect(
            m
                .get(ENTITY)
                ?.links.map((l) => l.nit)
                .sort(),
        ).toEqual(["900111", "900222"]);
        expect(m.get("900111")?.links[0]).toMatchObject({
            nit: ENTITY,
            relation: "adjudicatario",
        });
    });

    it("dedupes repeated links", () => {
        const m = buildNodeMeta([award("900111"), award("900111")], {
            watchedNits,
        });
        expect(m.get(ENTITY)?.links).toHaveLength(1);
        expect(m.get(ENTITY)?.degree).toBe(2); // degree still counts both edges
    });

    it("marks nodes touched by a flagged finding", () => {
        const m = buildNodeMeta([award("900111", "f-red")], {
            watchedNits,
            flaggedFindingIds: new Set(["f-red"]),
        });
        expect(m.get("900111")?.flagged).toBe(true);
        expect(m.get(ENTITY)?.flagged).toBe(true);
    });

    it("leaves an unrelated node as a plain counterpart", () => {
        const m = buildNodeMeta(
            [{ fromNit: "900111", toNit: "900222", relation: "socio" }],
            {},
        );
        expect(m.get("900111")?.role).toBe("contraparte");
    });
});

describe("describeNode", () => {
    it("summarises role, identity, connections and flag", () => {
        const m = buildNodeMeta([award("900111", "f-red")], {
            watchedNits,
            nameByNit: { "900111": "Constructora X" },
            flaggedFindingIds: new Set(["f-red"]),
        });
        const text = describeNode(m.get("900111")!);
        expect(text).toContain("Adjudicatario");
        expect(text).toContain("Constructora X");
        expect(text).toContain("900111");
        expect(text).toContain("bandera roja");
    });

    it("uses the plural for connections", () => {
        const m = buildNodeMeta([award("a"), award("b")], { watchedNits });
        expect(describeNode(m.get(ENTITY)!)).toContain("2 conexiones");
    });
});
