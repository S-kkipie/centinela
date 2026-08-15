/**
 * Per-tender investigation as a durable Cloudflare Workflow: each Croma/Gemini
 * call is a `step.do`, so a transient failure retries that step without redoing
 * the rest. Flow: expand notice → Gemini Flash sweep (triage) → if worth it,
 * cross-reference Croma → Gemini Pro scoring → persist via web API.
 *
 * Orchestration only; the reasoning lives in the pure, unit-tested modules.
 */
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import type { Env, InvestigateParams } from "./env.ts";
import { createCromaClient } from "./croma-stub.ts";
import { buildDossier } from "./investigate.ts";
import {
  SCORING_SCHEMA,
  SWEEP_SCHEMA,
  buildScoringPrompt,
  buildSweepPrompt,
  callGemini,
  parseScoring,
  parseSweep,
} from "./gemini.ts";
import type { TenderDetail } from "@centinela/contracts/croma";
import { mapToFinding } from "./mapping.ts";
import type { Dossier } from "./investigate.ts";
import { ingestFinding } from "./ingest.ts";

// Current stable defaults — Gemini 2.5 retires 2026-10-16; override via env.
const DEFAULT_SWEEP_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_SCORING_MODEL = "gemini-3.1-pro-preview";

export class InvestigateTender extends WorkflowEntrypoint<Env, InvestigateParams> {
  async run(event: WorkflowEvent<InvestigateParams>, step: WorkflowStep) {
    const { tender } = event.payload;
    const croma = createCromaClient(this.env);
    const sweepModel = this.env.GEMINI_SWEEP_MODEL ?? DEFAULT_SWEEP_MODEL;
    const scoringModel = this.env.GEMINI_SCORING_MODEL ?? DEFAULT_SCORING_MODEL;

    // step.do requires a Serializable return; our Croma/dossier types carry
    // `raw: unknown` which TS can't prove serializable, though it JSON-round-trips
    // fine across steps — so we cast at the boundary.
    // Not every sweep id is a notice UID the process endpoint accepts (e.g.
    // CO1.REQ.* request ids) — investigate without the detail instead of
    // letting the step retry a permanent rejection.
    const detail = (await step.do("secop-detail", async () => {
      if (!/^CO1\.NTC\./.test(tender.noticeUid)) return null;
      // biome-ignore lint/suspicious/noExplicitAny: serializable-boundary cast
      return (await croma.secopProcessByNotice(tender.noticeUid)) as any;
    })) as TenderDetail | null;

    const sweep = await step.do("gemini-sweep", async () => {
      const text = await callGemini(
        { model: sweepModel, apiKey: this.env.GEMINI_API_KEY },
        buildSweepPrompt(tender, detail),
        SWEEP_SCHEMA,
      );
      return parseSweep(text);
    });

    if (!sweep.interesting) {
      return { skipped: true, reason: sweep.reason };
    }

    const dossier = (await step.do("croma-crossref", async () =>
      // biome-ignore lint/suspicious/noExplicitAny: serializable-boundary cast
      (await buildDossier(tender, detail, croma)) as any,
    )) as Dossier;

    const scoring = await step.do("gemini-scoring", async () => {
      const text = await callGemini(
        { model: scoringModel, apiKey: this.env.GEMINI_API_KEY },
        buildScoringPrompt(dossier),
        SCORING_SCHEMA,
      );
      return parseScoring(text);
    });

    const finding = mapToFinding(dossier, scoring);

    await step.do("persist-finding", async () => {
      await ingestFinding(finding, {
        url: this.env.WEB_API_URL,
        key: this.env.AGENT_INGEST_KEY,
      });
      return { persisted: true };
    });

    return { skipped: false, tenderId: finding.tenderId, kind: finding.kind, score: finding.score };
  }
}
