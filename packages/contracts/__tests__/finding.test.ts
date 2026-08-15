import { describe, expect, it } from "vitest";
import {
  FINDING_KINDS,
  validateFindingIngest,
} from "../src/finding.ts";

const valid = {
  tenderId: "CO1.NTC.123456",
  entityId: "899999063",
  entityName: "Ministerio de Ejemplo",
  kind: "BANDERA_ROJA",
  score: 87,
  title: "Adjudicación con oferente único a empresa de 2 meses",
  summary: "Proveedor constituido 2 meses antes del cierre, único oferente.",
  evidence: [
    {
      source: "rues-entity-by-nit",
      url: "https://api.croma.run/rues-entity-by-nit",
      claim: "Matrícula registrada 2026-06-01",
    },
  ],
  graphEdges: [
    { from: "899999063", to: "901234567", relation: "awarded" },
  ],
};

describe("validateFindingIngest", () => {
  it("accepts a valid finding and returns it typed", () => {
    const result = validateFindingIngest(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("BANDERA_ROJA");
      expect(result.value.evidence).toHaveLength(1);
    }
  });

  it("accepts optional raw payload and optional evidence url", () => {
    const result = validateFindingIngest({
      ...valid,
      raw: { anything: true },
      evidence: [{ source: "secop-process-by-notice", claim: "x" }],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects non-objects", () => {
    for (const input of [null, undefined, 42, "x", []]) {
      const result = validateFindingIngest(input);
      expect(result.ok).toBe(false);
    }
  });

  it("rejects unknown kind", () => {
    const result = validateFindingIngest({ ...valid, kind: "MEDIO" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join()).toContain("kind");
  });

  it("rejects score outside 0-100 or non-number", () => {
    for (const score of [-1, 101, Number.NaN, "87"]) {
      const result = validateFindingIngest({ ...valid, score });
      expect(result.ok).toBe(false);
    }
  });

  it("accepts boundary scores 0 and 100", () => {
    expect(validateFindingIngest({ ...valid, score: 0 }).ok).toBe(true);
    expect(validateFindingIngest({ ...valid, score: 100 }).ok).toBe(true);
  });

  it("rejects missing or empty required strings", () => {
    for (const key of ["tenderId", "entityId", "entityName", "title", "summary"]) {
      const missing = { ...valid, [key]: undefined };
      expect(validateFindingIngest(missing).ok).toBe(false);
      const empty = { ...valid, [key]: "" };
      expect(validateFindingIngest(empty).ok).toBe(false);
    }
  });

  it("requires at least one evidence item with source and claim", () => {
    expect(validateFindingIngest({ ...valid, evidence: [] }).ok).toBe(false);
    expect(
      validateFindingIngest({ ...valid, evidence: [{ source: "secop" }] }).ok,
    ).toBe(false);
  });

  it("allows empty graphEdges but rejects malformed edges", () => {
    expect(validateFindingIngest({ ...valid, graphEdges: [] }).ok).toBe(true);
    expect(
      validateFindingIngest({
        ...valid,
        graphEdges: [{ from: "a", to: "b" }],
      }).ok,
    ).toBe(false);
  });

  it("collects multiple errors at once", () => {
    const result = validateFindingIngest({ kind: "nope", score: 200 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(2);
  });

  it("exposes the two finding kinds", () => {
    expect(FINDING_KINDS).toEqual(["OPORTUNIDAD", "BANDERA_ROJA"]);
  });
});
