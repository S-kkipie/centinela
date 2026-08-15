import { describe, expect, it, vi } from "vitest";
import type { Tender, TenderDetail } from "@centinela/contracts/croma";
import {
  SCORING_SCHEMA,
  SWEEP_SCHEMA,
  buildScoringPrompt,
  buildSweepPrompt,
  callGemini,
  parseScoring,
  parseSweep,
} from "../src/gemini.ts";
import type { Dossier } from "../src/investigate.ts";

const tender: Tender = {
  noticeUid: "CO1.NTC.777",
  entityNit: "899999061",
  entityName: "Alcaldía de Bogotá",
  title: "Construcción de puente peatonal",
  valueCop: 12_000_000_000,
  status: "adjudicado",
  raw: null,
};

const detail: TenderDetail = {
  ...tender,
  providers: [{ nit: "900123456", name: "CONSTRUCTORA FANTASMA SAS", awarded: true }],
};

const dossier: Dossier = {
  tender,
  detail,
  providers: [
    {
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
      financials: [{ nit: "900123456", year: 2025, totalAssetsCop: 5_000_000, raw: null }],
      judicial: [],
      sanctions: [],
      contracts: [
        { noticeUid: "CO1.NTC.001", entityNit: "899999061", valueCop: 8e9, raw: null },
      ],
    },
  ],
};

describe("buildSweepPrompt", () => {
  it("includes the tender identity and value the model needs to triage", () => {
    const p = buildSweepPrompt(tender, detail);
    expect(p).toContain("CO1.NTC.777");
    expect(p).toContain("Construcción de puente peatonal");
    expect(p).toContain("12000000000");
  });
});

describe("parseSweep", () => {
  it("parses a well-formed verdict", () => {
    const v = parseSweep(
      JSON.stringify({ interesting: true, angle: "BANDERA_ROJA", reason: "empresa recién creada" }),
    );
    expect(v).toEqual({ interesting: true, angle: "BANDERA_ROJA", reason: "empresa recién creada" });
  });

  it("accepts NINGUNO as the not-interesting angle", () => {
    const v = parseSweep(JSON.stringify({ interesting: false, angle: "NINGUNO", reason: "rutina" }));
    expect(v.interesting).toBe(false);
    expect(v.angle).toBe("NINGUNO");
  });

  it("rejects an unknown angle enum", () => {
    expect(() => parseSweep(JSON.stringify({ interesting: true, angle: "MAYBE", reason: "x" }))).toThrow();
  });

  it("rejects non-JSON", () => {
    expect(() => parseSweep("not json")).toThrow();
  });
});

describe("SWEEP_SCHEMA", () => {
  it("constrains angle to the three allowed values", () => {
    expect(SWEEP_SCHEMA.properties.angle.enum).toEqual([
      "OPORTUNIDAD",
      "BANDERA_ROJA",
      "NINGUNO",
    ]);
    expect(SWEEP_SCHEMA.required).toContain("interesting");
  });
});

describe("buildScoringPrompt", () => {
  it("embeds provider evidence so the model can cite it", () => {
    const p = buildScoringPrompt(dossier);
    expect(p).toContain("900123456");
    expect(p).toContain("CONSTRUCTORA FANTASMA SAS");
  });
});

describe("SCORING_SCHEMA", () => {
  it("forces kind enum + integer score + evidence/graphEdges arrays", () => {
    expect(SCORING_SCHEMA.properties.kind.enum).toEqual(["OPORTUNIDAD", "BANDERA_ROJA"]);
    expect(SCORING_SCHEMA.properties.score.type).toBe("integer");
    expect(SCORING_SCHEMA.properties.evidence.type).toBe("array");
    expect(SCORING_SCHEMA.properties.graphEdges.type).toBe("array");
  });
});

describe("parseScoring", () => {
  const good = {
    kind: "BANDERA_ROJA",
    score: 88,
    title: "Adjudicación a empresa recién creada",
    summary: "La constructora fue creada un mes antes de ganar.",
    evidence: [{ source: "rues-entity-by-nit", claim: "Constituida 2026-07-01" }],
    graphEdges: [{ from: "900123456", to: "899999061", relation: "adjudicatario" }],
  };

  it("parses a well-formed scoring", () => {
    expect(parseScoring(JSON.stringify(good))).toEqual(good);
  });

  it("rejects a score outside 0-100", () => {
    expect(() => parseScoring(JSON.stringify({ ...good, score: 150 }))).toThrow();
  });

  it("rejects an unknown kind", () => {
    expect(() => parseScoring(JSON.stringify({ ...good, kind: "NEUTRAL" }))).toThrow();
  });

  it("rejects empty evidence (findings must be cited)", () => {
    expect(() => parseScoring(JSON.stringify({ ...good, evidence: [] }))).toThrow();
  });
});

describe("callGemini", () => {
  it("posts to the model endpoint with schema config and extracts the JSON text", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
        }),
        { status: 200 },
      ),
    );
    const text = await callGemini(
      { model: "gemini-3.5-flash-lite", apiKey: "KEY123" },
      "prompt here",
      SWEEP_SCHEMA,
      fetchImpl as unknown as typeof fetch,
    );
    expect(text).toBe('{"ok":true}');

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("gemini-3.5-flash-lite:generateContent");
    expect(String(url)).toContain("key=KEY123");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toEqual(SWEEP_SCHEMA);
    expect(body.contents[0].parts[0].text).toBe("prompt here");
  });

  it("throws on a non-200 response", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 429 }));
    await expect(
      callGemini(
        { model: "m", apiKey: "k" },
        "p",
        SWEEP_SCHEMA,
        fetchImpl as unknown as typeof fetch,
      ),
    ).rejects.toThrow();
  });
});
