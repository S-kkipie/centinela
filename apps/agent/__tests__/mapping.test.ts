import { describe, expect, it } from "vitest";
import { validateFindingIngest } from "@centinela/contracts/finding";
import type { Tender, TenderDetail } from "@centinela/contracts/croma";
import type { GeminiScoring } from "../src/gemini.ts";
import type { Dossier, ProviderDossier } from "../src/investigate.ts";
import { mapToFinding } from "../src/mapping.ts";

const tender: Tender = {
  noticeUid: "CO1.NTC.777",
  entityNit: "899999061",
  entityName: "Alcaldía de Bogotá",
  title: "Construcción de puente peatonal",
  valueCop: 12_000_000_000,
  status: "adjudicado",
  raw: null,
};

function provider(over: Partial<ProviderDossier> = {}): ProviderDossier {
  return {
    nit: "900123456",
    name: "CONSTRUCTORA FANTASMA SAS",
    company: {
      nit: "900123456",
      name: "CONSTRUCTORA FANTASMA SAS",
      status: "ACTIVA",
      incorporationDate: "2026-07-01",
      legalRepresentatives: [{ document: "79123456", name: "Juan Pérez" }],
      raw: null,
    },
    financials: [],
    judicial: [],
    sanctions: [],
    contracts: [],
    ...over,
  };
}

function dossier(providers: ProviderDossier[]): Dossier {
  const detail: TenderDetail = {
    ...tender,
    providers: providers.map((p) => ({ nit: p.nit, name: p.name, awarded: true })),
  };
  return { tender, detail, providers };
}

const scoring: GeminiScoring = {
  kind: "BANDERA_ROJA",
  score: 88,
  title: "Adjudicación a empresa recién creada",
  summary: "La constructora fue creada un mes antes de ganar el contrato.",
  evidence: [
    { source: "rues-entity-by-nit", claim: "Constituida el 2026-07-01" },
    { source: "secop-process-by-notice", url: "https://x", claim: "Adjudicado 2026-08-01" },
  ],
  // Gemini may suggest edges with NAMES — these must NOT leak into the finding.
  graphEdges: [{ from: "CONSTRUCTORA FANTASMA SAS", to: "Alcaldía de Bogotá", relation: "ganó" }],
};

describe("mapToFinding", () => {
  it("maps tender + scoring onto the FindingIngest contract", () => {
    const f = mapToFinding(dossier([provider({ company: { ...provider().company!, legalRepresentatives: [] } })]), scoring);
    expect(f.tenderId).toBe("CO1.NTC.777");
    expect(f.entityId).toBe("899999061");
    expect(f.entityName).toBe("Alcaldía de Bogotá");
    expect(f.kind).toBe("BANDERA_ROJA");
    expect(f.score).toBe(88);
    expect(f.title).toBe(scoring.title);
    expect(f.summary).toBe(scoring.summary);
    expect(f.evidence).toEqual(scoring.evidence);
  });

  it("produces a body that passes the shared validator", () => {
    const f = mapToFinding(dossier([provider()]), scoring);
    const result = validateFindingIngest(f);
    expect(result.ok).toBe(true);
  });

  it("derives graph edges from the dossier so from/to are always NITs/documents", () => {
    const f = mapToFinding(dossier([provider()]), scoring);
    // provider → contracting entity, keyed by NITs
    expect(f.graphEdges).toContainEqual({
      from: "900123456",
      to: "899999061",
      relation: "adjudicatario",
    });
    // legal rep → provider, keyed by document + NIT
    expect(f.graphEdges).toContainEqual({
      from: "79123456",
      to: "900123456",
      relation: "representante_legal",
    });
    // no display name ever appears as an edge endpoint
    const endpoints = f.graphEdges.flatMap((e) => [e.from, e.to]);
    expect(endpoints).not.toContain("CONSTRUCTORA FANTASMA SAS");
    expect(endpoints).not.toContain("Alcaldía de Bogotá");
  });

  it("uses relation 'proponente' for a non-awarded provider", () => {
    const d = dossier([provider()]);
    d.detail!.providers[0].awarded = false;
    const f = mapToFinding(d, scoring);
    expect(f.graphEdges).toContainEqual({
      from: "900123456",
      to: "899999061",
      relation: "proponente",
    });
  });

  it("emits an empty edge list (still valid) when no providers are exposed", () => {
    const f = mapToFinding(dossier([]), { ...scoring, kind: "OPORTUNIDAD" });
    expect(f.graphEdges).toEqual([]);
    expect(validateFindingIngest(f).ok).toBe(true);
  });

  it("dedupes identical derived edges", () => {
    const p = provider();
    const f = mapToFinding(dossier([p, p]), scoring);
    const adj = f.graphEdges.filter((e) => e.relation === "adjudicatario");
    expect(adj).toHaveLength(1);
  });
});
