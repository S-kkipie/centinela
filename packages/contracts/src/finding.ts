/**
 * Shared contract for agent → web persistence.
 *
 * The agent (apps/agent, WS3) builds a `FindingIngest` per investigated tender
 * and POSTs it to `POST /api/agent/findings` (apps/web, WS2) with header
 * `x-agent-key: <AGENT_INGEST_KEY>`. The web side MUST validate the body with
 * `validateFindingIngest` before persisting.
 *
 * Owned by the orchestrator session — changes go through it (see PLAN.md).
 */

export const FINDING_KINDS = ["OPORTUNIDAD", "BANDERA_ROJA"] as const;
export type FindingKind = (typeof FINDING_KINDS)[number];

export interface FindingEvidence {
  /** Croma endpoint or source the claim comes from, e.g. "rues-entity-by-nit". */
  source: string;
  url?: string;
  claim: string;
}

export interface FindingGraphEdge {
  /** NIT / document id of the source node — NOT a display name (dedup key). */
  from: string;
  /** NIT / document id of the target node — NOT a display name (dedup key). */
  to: string;
  relation: string;
}

export interface FindingIngest {
  tenderId: string;
  entityId: string;
  entityName: string;
  kind: FindingKind;
  /** 0-100. */
  score: number;
  title: string;
  summary: string;
  evidence: FindingEvidence[];
  graphEdges: FindingGraphEdge[];
  raw?: unknown;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const REQUIRED_STRINGS = [
  "tenderId",
  "entityId",
  "entityName",
  "title",
  "summary",
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function validateFindingIngest(
  input: unknown,
): ValidationResult<FindingIngest> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["body must be a JSON object"] };
  }
  const body = input as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of REQUIRED_STRINGS) {
    if (!isNonEmptyString(body[key])) {
      errors.push(`${key} must be a non-empty string`);
    }
  }

  if (!FINDING_KINDS.includes(body.kind as FindingKind)) {
    errors.push(`kind must be one of ${FINDING_KINDS.join(" | ")}`);
  }

  const score = body.score;
  if (typeof score !== "number" || Number.isNaN(score) || score < 0 || score > 100) {
    errors.push("score must be a number between 0 and 100");
  }

  const evidence = body.evidence;
  if (!Array.isArray(evidence) || evidence.length === 0) {
    errors.push("evidence must be a non-empty array");
  } else {
    for (const [i, item] of evidence.entries()) {
      const entry = item as Record<string, unknown> | null;
      if (
        typeof entry !== "object" ||
        entry === null ||
        !isNonEmptyString(entry.source) ||
        !isNonEmptyString(entry.claim) ||
        (entry.url !== undefined && !isNonEmptyString(entry.url))
      ) {
        errors.push(`evidence[${i}] must have source and claim (url optional)`);
      }
    }
  }

  const graphEdges = body.graphEdges;
  if (!Array.isArray(graphEdges)) {
    errors.push("graphEdges must be an array (may be empty)");
  } else {
    for (const [i, item] of graphEdges.entries()) {
      const edge = item as Record<string, unknown> | null;
      if (
        typeof edge !== "object" ||
        edge === null ||
        !isNonEmptyString(edge.from) ||
        !isNonEmptyString(edge.to) ||
        !isNonEmptyString(edge.relation)
      ) {
        errors.push(`graphEdges[${i}] must have from, to and relation`);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: body as unknown as FindingIngest };
}
