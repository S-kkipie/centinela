/**
 * Dossier + Gemini scoring → the `FindingIngest` the web API persists.
 *
 * Graph edges are derived from the structured dossier, NOT from Gemini's
 * free-text suggestions: the orchestrator's contract requires from/to to be
 * NITs / identity documents (they are the graph's node-dedupe key on the
 * dashboard; WS2 resolves display names via RUES). Deriving them here guarantees
 * that invariant even if the model tries to emit names.
 */
import type { FindingGraphEdge, FindingIngest } from "@centinela/contracts/finding";
import type { Dossier } from "./investigate.ts";
import type { GeminiScoring } from "./gemini.ts";

function deriveGraphEdges(dossier: Dossier): FindingGraphEdge[] {
  const entityNit = dossier.tender.entityNit;
  const awardedByNit = new Map<string, boolean>();
  for (const p of dossier.detail?.providers ?? []) {
    awardedByNit.set(p.nit, Boolean(p.awarded));
  }

  const edges: FindingGraphEdge[] = [];
  for (const provider of dossier.providers) {
    edges.push({
      from: provider.nit,
      to: entityNit,
      relation: awardedByNit.get(provider.nit) ? "adjudicatario" : "proponente",
    });
    for (const rep of provider.company?.legalRepresentatives ?? []) {
      edges.push({ from: rep.document, to: provider.nit, relation: "representante_legal" });
    }
  }

  return dedupe(edges);
}

function dedupe(edges: FindingGraphEdge[]): FindingGraphEdge[] {
  const seen = new Set<string>();
  const out: FindingGraphEdge[] = [];
  for (const e of edges) {
    const key = `${e.from}|${e.to}|${e.relation}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  }
  return out;
}

/** Build the finding POST body. Assumes `scoring` already validated by parseScoring. */
export function mapToFinding(dossier: Dossier, scoring: GeminiScoring): FindingIngest {
  return {
    tenderId: dossier.tender.noticeUid,
    entityId: dossier.tender.entityNit,
    entityName: dossier.tender.entityName,
    kind: scoring.kind,
    score: scoring.score,
    title: scoring.title,
    summary: scoring.summary,
    evidence: scoring.evidence,
    graphEdges: deriveGraphEdges(dossier),
    raw: { tender: dossier.tender.raw, geminiGraphEdges: scoring.graphEdges },
  };
}
