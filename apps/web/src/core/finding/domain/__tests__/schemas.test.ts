import { describe, expect, it } from "vitest";
import {
    findingSchema,
    findingSearchSchema,
    graphEdgeSchema,
} from "../schemas";

const baseFinding = {
    id: "f1",
    watchlistId: "w1",
    tenderId: "t1",
    entityId: "900123456",
    entityName: "Alcaldía de Bogotá",
    kind: "BANDERA_ROJA",
    score: 87,
    title: "Adjudicación sospechosa",
    summary: "Un solo proponente, capital insuficiente.",
    evidence: [
        { source: "rues-entity-by-nit", claim: "Capital $1M vs contrato $2B" },
    ],
    createdAt: "2026-08-15T00:00:00.000Z",
    updatedAt: "2026-08-15T00:00:00.000Z",
};

describe("findingSchema", () => {
    it("accepts a valid finding with ISO timestamps", () => {
        expect(findingSchema.safeParse(baseFinding).success).toBe(true);
    });

    it("accepts optional evidence url", () => {
        const withUrl = {
            ...baseFinding,
            evidence: [
                {
                    source: "secop",
                    url: "https://example.com",
                    claim: "x",
                },
            ],
        };
        expect(findingSchema.safeParse(withUrl).success).toBe(true);
    });

    it("rejects a score above 100", () => {
        expect(
            findingSchema.safeParse({ ...baseFinding, score: 101 }).success,
        ).toBe(false);
    });

    it("rejects an unknown kind", () => {
        expect(
            findingSchema.safeParse({ ...baseFinding, kind: "MAYBE" }).success,
        ).toBe(false);
    });
});

describe("findingSearchSchema", () => {
    it("applies page/perPage defaults", () => {
        const parsed = findingSearchSchema.parse({});
        expect(parsed.page).toBe(1);
        expect(parsed.perPage).toBe(20);
    });

    it("normalizes a single kind into a 1-element array", () => {
        expect(findingSearchSchema.parse({ kind: "OPORTUNIDAD" }).kind).toEqual(
            ["OPORTUNIDAD"],
        );
    });

    it("degrades an invalid kind to an empty array", () => {
        expect(findingSearchSchema.parse({ kind: "bogus" }).kind).toEqual([]);
    });

    it("coerces page from a string", () => {
        expect(findingSearchSchema.parse({ page: "3" }).page).toBe(3);
    });
});

describe("graphEdgeSchema", () => {
    it("accepts an edge with a nullable findingId", () => {
        const edge = {
            id: "e1",
            watchlistId: "w1",
            findingId: null,
            fromNit: "900123456",
            toNit: "800987654",
            relation: "shared_legal_rep",
            createdAt: "2026-08-15T00:00:00.000Z",
        };
        expect(graphEdgeSchema.safeParse(edge).success).toBe(true);
    });
});
