import { describe, expect, it } from "vitest";
import {
    analyzeConcentration,
    type ConcentrationEdge,
    describeConcentration,
} from "@/core/copilot/client/analysis/concentration";

const ENTITY = "899999061";
const watchedNits = new Set([ENTITY]);

function award(winner: string, findingId?: string): ConcentrationEdge {
    return {
        fromNit: ENTITY,
        toNit: winner,
        relation: "adjudicatario",
        findingId: findingId ?? null,
    };
}

describe("analyzeConcentration", () => {
    it("returns an empty report with no edges", () => {
        const r = analyzeConcentration([]);
        expect(r.totalAwards).toBe(0);
        expect(r.distinctWinners).toBe(0);
        expect(r.hhi).toBe(0);
        expect(r.notable).toBe(false);
    });

    it("counts awards per winner and ranks them", () => {
        const r = analyzeConcentration(
            [
                award("900111"),
                award("900111"),
                award("900111"),
                award("900222"),
            ],
            { watchedNits },
        );
        expect(r.totalAwards).toBe(4);
        expect(r.distinctWinners).toBe(2);
        expect(r.top[0]).toMatchObject({ nit: "900111", awards: 3 });
        expect(r.top[0].share).toBeCloseTo(0.75);
    });

    // graphEdges carry no guaranteed orientation, so the watched entity — not
    // the field name — is what identifies the contracting side.
    it("reads the winner as the endpoint that is not the watched entity", () => {
        const reversed: ConcentrationEdge = {
            fromNit: "900333",
            toNit: ENTITY,
            relation: "adjudicatario",
        };
        const r = analyzeConcentration([reversed], { watchedNits });
        expect(r.top[0].nit).toBe("900333");
    });

    it("falls back to toNit when neither endpoint is watched", () => {
        const r = analyzeConcentration([award("900444")]);
        expect(r.top[0].nit).toBe("900444");
    });

    it("computes HHI: one winner taking everything is 1", () => {
        const r = analyzeConcentration([award("900111"), award("900111")], {
            watchedNits,
        });
        expect(r.hhi).toBeCloseTo(1);
    });

    it("computes HHI: an even four-way split is 0.25", () => {
        const r = analyzeConcentration(
            [award("a"), award("b"), award("c"), award("d")],
            { watchedNits },
        );
        expect(r.hhi).toBeCloseTo(0.25);
    });

    it("marks a winner touched by a red flag", () => {
        const r = analyzeConcentration([award("900111", "f-red")], {
            watchedNits,
            flaggedFindingIds: new Set(["f-red"]),
        });
        expect(r.top[0].flagged).toBe(true);
    });

    it("ignores thin evidence: two awards never counts as notable", () => {
        const r = analyzeConcentration([award("900111"), award("900111")], {
            watchedNits,
        });
        expect(r.hhi).toBeCloseTo(1);
        expect(r.notable).toBe(false);
    });

    it("flags a concentrated network once there is enough of it", () => {
        const r = analyzeConcentration(
            [award("900111"), award("900111"), award("900111")],
            { watchedNits },
        );
        expect(r.notable).toBe(true);
    });
});

describe("analyzeConcentration · shared representatives", () => {
    const edges: ConcentrationEdge[] = [
        award("900111"),
        award("900222"),
        {
            fromNit: "CC-79123",
            toNit: "900111",
            relation: "representante_legal",
        },
        // Reversed on purpose: direction must not matter.
        {
            fromNit: "900222",
            toNit: "CC-79123",
            relation: "representante_legal",
        },
    ];

    it("ties two distinct winners to one representative", () => {
        const r = analyzeConcentration(edges, { watchedNits });
        expect(r.sharedRepresentatives).toEqual([
            { nit: "CC-79123", represents: ["900111", "900222"] },
        ]);
        // A shared representative is a story regardless of award volume.
        expect(r.notable).toBe(true);
    });

    it("ignores a representative tied to a single winner", () => {
        const r = analyzeConcentration(
            [
                award("900111"),
                {
                    fromNit: "CC-79123",
                    toNit: "900111",
                    relation: "representante_legal",
                },
            ],
            { watchedNits },
        );
        expect(r.sharedRepresentatives).toEqual([]);
    });
});

describe("describeConcentration", () => {
    it("says so when there is nothing to describe", () => {
        expect(describeConcentration(analyzeConcentration([]))).toContain(
            "todavía no registra",
        );
    });

    it("leads with the top counterparty and its percentage", () => {
        const text = describeConcentration(
            analyzeConcentration(
                [award("900111"), award("900111"), award("900111"), award("b")],
                { watchedNits },
            ),
        );
        expect(text).toContain("900111");
        expect(text).toContain("75%");
        expect(text).toContain("concentrado");
    });

    it("names the shared representative when there is one", () => {
        const text = describeConcentration(
            analyzeConcentration(
                [
                    award("900111"),
                    award("900222"),
                    {
                        fromNit: "CC-79123",
                        toNit: "900111",
                        relation: "representante_legal",
                    },
                    {
                        fromNit: "CC-79123",
                        toNit: "900222",
                        relation: "representante_legal",
                    },
                ],
                { watchedNits },
            ),
        );
        expect(text).toContain("CC-79123");
        expect(text).toContain("representante");
    });
});
