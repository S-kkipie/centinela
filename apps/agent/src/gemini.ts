/**
 * Gemini reasoning — two-stage, structured output.
 *
 * Stage 1 (sweep): a cheap Flash-Lite call triages each tender off the firehose
 * — worth a full investigation or not. Stage 2 (scoring): a Pro call turns the
 * cross-referenced dossier into a cited OPORTUNIDAD | BANDERA_ROJA verdict.
 *
 * Model IDs are env-driven (see Env), never hard-coded: the Gemini lineup moves
 * fast (2.5 retires 2026-10-16; 3.5/3.6/3.7 Flash and 3.1 Pro all live). Prompt
 * building, schema, and response parsing are pure and unit-tested; only
 * `callGemini` touches the network, and it takes an injectable fetch.
 */
import type { FindingEvidence, FindingGraphEdge, FindingKind } from "@centinela/contracts/finding";
import type { Tender, TenderDetail } from "@centinela/contracts/croma";
import type { Dossier } from "./investigate.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ── Stage 1: sweep triage ────────────────────────────────────────────────────

export type SweepAngle = FindingKind | "NINGUNO";

export interface SweepVerdict {
  interesting: boolean;
  angle: SweepAngle;
  reason: string;
}

export const SWEEP_SCHEMA = {
  type: "object",
  properties: {
    interesting: { type: "boolean" },
    angle: { type: "string", enum: ["OPORTUNIDAD", "BANDERA_ROJA", "NINGUNO"] },
    reason: { type: "string" },
  },
  required: ["interesting", "angle", "reason"],
} as const;

export function buildSweepPrompt(tender: Tender, detail: TenderDetail | null): string {
  const providers = (detail?.providers ?? [])
    .map((p) => `- ${p.nit}${p.name ? ` (${p.name})` : ""}${p.awarded ? " [ADJUDICADO]" : ""}`)
    .join("\n");
  return [
    "Eres un analista de contratación pública colombiana (SECOP).",
    "Decide si este proceso merece una investigación profunda.",
    "Marca interesting=true si hay señal de OPORTUNIDAD (licitación abierta ganable por una PYME honesta)",
    "o de BANDERA_ROJA (indicio de adjudicación amañada). Si es rutina, angle=NINGUNO.",
    "",
    `noticeUid: ${tender.noticeUid}`,
    `entidad: ${tender.entityName} (NIT ${tender.entityNit})`,
    `objeto: ${tender.title}`,
    `valor COP: ${tender.valueCop ?? "sin publicar"}`,
    `estado: ${tender.status ?? "desconocido"}`,
    providers ? `proveedores:\n${providers}` : "proveedores: ninguno expuesto",
  ].join("\n");
}

export function parseSweep(text: string): SweepVerdict {
  const obj = parseJson(text);
  if (typeof obj.interesting !== "boolean") throw new GeminiParseError("interesting must be boolean");
  if (obj.angle !== "OPORTUNIDAD" && obj.angle !== "BANDERA_ROJA" && obj.angle !== "NINGUNO") {
    throw new GeminiParseError("angle must be OPORTUNIDAD | BANDERA_ROJA | NINGUNO");
  }
  if (typeof obj.reason !== "string") throw new GeminiParseError("reason must be string");
  return { interesting: obj.interesting, angle: obj.angle, reason: obj.reason };
}

// ── Stage 2: scoring ─────────────────────────────────────────────────────────

export interface GeminiScoring {
  kind: FindingKind;
  score: number;
  title: string;
  summary: string;
  evidence: FindingEvidence[];
  graphEdges: FindingGraphEdge[];
}

export const SCORING_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["OPORTUNIDAD", "BANDERA_ROJA"] },
    score: { type: "integer" },
    title: { type: "string" },
    summary: { type: "string" },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: { type: "string" },
          url: { type: "string" },
          claim: { type: "string" },
        },
        required: ["source", "claim"],
      },
    },
    graphEdges: {
      type: "array",
      items: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          relation: { type: "string" },
        },
        required: ["from", "to", "relation"],
      },
    },
  },
  required: ["kind", "score", "title", "summary", "evidence", "graphEdges"],
} as const;

export function buildScoringPrompt(dossier: Dossier): string {
  const { tender, providers } = dossier;
  const providerBlocks = providers.map((p) => {
    const inc = p.company?.incorporationDate ?? "desconocida";
    const reps = p.company?.legalRepresentatives.map((r) => `${r.name} (${r.document})`).join(", ") || "sin datos";
    return [
      `Proveedor NIT ${p.nit}${p.name ? ` — ${p.name}` : ""}`,
      `  constitución RUES: ${inc} · estado: ${p.company?.status ?? "sin match RUES"}`,
      `  representantes legales: ${reps}`,
      `  contratos SECOP históricos: ${p.contracts.length}`,
      `  estados financieros: ${p.financials.length} · procesos judiciales: ${p.judicial.length} · sanciones: ${p.sanctions.length}`,
    ].join("\n");
  });
  return [
    "Eres un investigador anticorrupción de contratación pública colombiana.",
    "Con la evidencia cruzada de Croma (SECOP, RUES, Supersociedades, Rama Judicial, sanciones),",
    "clasifica el proceso como OPORTUNIDAD o BANDERA_ROJA y asígnale un score 0-100.",
    "CADA afirmación en evidence debe citar su fuente (endpoint Croma). En graphEdges,",
    "from/to DEBEN ser NITs o números de documento, NUNCA nombres.",
    "",
    `noticeUid: ${tender.noticeUid}`,
    `entidad contratante: ${tender.entityName} (NIT ${tender.entityNit})`,
    `objeto: ${tender.title} · valor COP: ${tender.valueCop ?? "sin publicar"} · estado: ${tender.status ?? "?"}`,
    "",
    providerBlocks.length ? providerBlocks.join("\n\n") : "Sin proveedores expuestos todavía.",
  ].join("\n");
}

export function parseScoring(text: string): GeminiScoring {
  const obj = parseJson(text);
  if (obj.kind !== "OPORTUNIDAD" && obj.kind !== "BANDERA_ROJA") {
    throw new GeminiParseError("kind must be OPORTUNIDAD | BANDERA_ROJA");
  }
  if (
    typeof obj.score !== "number" ||
    Number.isNaN(obj.score) ||
    obj.score < 0 ||
    obj.score > 100
  ) {
    throw new GeminiParseError("score must be a number 0-100");
  }
  if (typeof obj.title !== "string" || typeof obj.summary !== "string") {
    throw new GeminiParseError("title and summary must be strings");
  }
  if (!Array.isArray(obj.evidence) || obj.evidence.length === 0) {
    throw new GeminiParseError("evidence must be a non-empty array");
  }
  if (!Array.isArray(obj.graphEdges)) {
    throw new GeminiParseError("graphEdges must be an array");
  }
  return {
    kind: obj.kind,
    score: obj.score,
    title: obj.title,
    summary: obj.summary,
    evidence: obj.evidence as FindingEvidence[],
    graphEdges: obj.graphEdges as FindingGraphEdge[],
  };
}

// ── Network (thin) ───────────────────────────────────────────────────────────

export interface GeminiCall {
  model: string;
  apiKey: string;
}

/** Single structured-output generateContent call. Returns the raw JSON text. */
export async function callGemini(
  { model, apiKey }: GeminiCall,
  prompt: string,
  responseSchema: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema },
    }),
  });
  if (!res.ok) {
    throw new GeminiParseError(`Gemini ${model} HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new GeminiParseError("no text candidate in Gemini response");
  return text;
}

export class GeminiParseError extends Error {}

function parseJson(text: string): Record<string, unknown> {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new GeminiParseError("response was not valid JSON");
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new GeminiParseError("response must be a JSON object");
  }
  return obj as Record<string, unknown>;
}
