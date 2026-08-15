import { describe, expect, it } from "vitest";
import {
    explainFindingParams,
    filterFindingsParams,
    openFindingParams,
    resolveFinding,
    toFindingFilter,
} from "@/core/copilot/client/tools/finding-tools-core";

const items = [
    {
        id: "f-1",
        entityName: "Secretaría de Salud de Bogotá",
        title: "Adjudicación exprés obra hospitalaria",
        kind: "BANDERA_ROJA" as const,
        createdAt: "2026-08-14T00:00:00.000Z",
    },
    {
        id: "f-2",
        entityName: "Alcaldía de Medellín",
        title: "Licitación vías terciarias",
        kind: "OPORTUNIDAD" as const,
        createdAt: "2026-08-10T00:00:00.000Z",
    },
];

describe("tool param schemas", () => {
    it("filterFindings accepts partial filters and rejects bad kinds", () => {
        expect(
            filterFindingsParams.parse({ kind: "BANDERA_ROJA", sinceDays: 7 }),
        ).toEqual({ kind: "BANDERA_ROJA", sinceDays: 7 });
        expect(filterFindingsParams.parse({})).toEqual({});
        expect(() =>
            filterFindingsParams.parse({ kind: "ROJA" }),
        ).toThrowError();
    });

    it("openFinding/explainFinding require a findingId", () => {
        expect(openFindingParams.parse({ findingId: "f-1" })).toEqual({
            findingId: "f-1",
        });
        expect(() => explainFindingParams.parse({})).toThrowError();
    });
});

describe("toFindingFilter", () => {
    it("maps empty params to null (clear)", () => {
        expect(toFindingFilter({})).toBeNull();
    });

    it("passes through set fields only", () => {
        expect(
            toFindingFilter({ entityQuery: "salud", sinceDays: 7 }),
        ).toEqual({ entityQuery: "salud", sinceDays: 7 });
    });
});

describe("resolveFinding", () => {
    it("finds by exact id", () => {
        expect(resolveFinding(items, "f-2")?.id).toBe("f-2");
    });

    it("falls back to title/entity substring match", () => {
        expect(resolveFinding(items, "hospitalaria")?.id).toBe("f-1");
        expect(resolveFinding(items, "medellín")?.id).toBe("f-2");
    });

    it("returns undefined when nothing matches", () => {
        expect(resolveFinding(items, "no-existe")).toBeUndefined();
    });
});
