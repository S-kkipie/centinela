import { describe, expect, it } from "vitest";
import {
    extractCuantia,
    selectForCompare,
} from "@/core/copilot/client/ui/compare-select";
import type { Finding } from "@/core/finding/domain/types";

function finding(
    id: string,
    kind: Finding["kind"],
    summary = "",
): Finding {
    return {
        id,
        watchlistId: "w1",
        tenderId: `t-${id}`,
        entityId: `e-${id}`,
        entityName: `Entidad ${id}`,
        kind,
        score: 80,
        title: `Hallazgo ${id}`,
        summary,
        evidence: [],
        createdAt: "2026-08-15T00:00:00.000Z",
        updatedAt: "2026-08-15T00:00:00.000Z",
    };
}

describe("selectForCompare", () => {
    const items = [
        finding("a", "OPORTUNIDAD"),
        finding("b", "OPORTUNIDAD"),
        finding("c", "BANDERA_ROJA"),
        finding("d", "OPORTUNIDAD"),
    ];

    it("returns the requested OPORTUNIDAD findings in id order", () => {
        expect(selectForCompare(items, ["b", "a"]).map((f) => f.id)).toEqual([
            "b",
            "a",
        ]);
    });

    it("drops ids that are not OPORTUNIDAD", () => {
        expect(selectForCompare(items, ["a", "c"]).map((f) => f.id)).toEqual([
            "a",
        ]);
    });

    it("drops ids missing from the cache", () => {
        expect(selectForCompare(items, ["a", "zzz"]).map((f) => f.id)).toEqual([
            "a",
        ]);
    });

    it("dedupes repeated ids", () => {
        expect(selectForCompare(items, ["a", "a", "b"]).map((f) => f.id)).toEqual(
            ["a", "b"],
        );
    });

    it("caps the selection at three", () => {
        const out = selectForCompare(items, ["a", "b", "d", "a"]);
        expect(out.map((f) => f.id)).toEqual(["a", "b", "d"]);
    });
});

describe("extractCuantia", () => {
    it("pulls a peso amount out of the summary", () => {
        expect(extractCuantia("Contrato por $1.200.000.000 COP")).toBe(
            "$1.200.000.000",
        );
    });

    it("handles a plain COP suffix without a symbol", () => {
        expect(extractCuantia("Adjudicado 850.000.000 COP a la firma")).toBe(
            "850.000.000 COP",
        );
    });

    it("returns null when no amount is present", () => {
        expect(extractCuantia("Sin cifras en el resumen")).toBeNull();
    });
});
