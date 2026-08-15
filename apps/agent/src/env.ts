/** Shared bindings + message/param shapes for the Worker, DO, Queue and Workflow. */
import type { Tender } from "@centinela/contracts/croma";
import type { CentinelaAgent } from "./index.ts";

/** One queue message = one tender to investigate (respects the 50-subrequest cap). */
export interface TenderMessage {
  tender: Tender;
}

/** Workflow input: a single tender investigation run. */
export interface InvestigateParams {
  tender: Tender;
}

export interface Env {
  CentinelaAgent: DurableObjectNamespace<CentinelaAgent>;
  CRAWL_QUEUE: Queue<TenderMessage>;
  INVESTIGATE: Workflow<InvestigateParams>;

  // Secrets (wrangler secret put / .dev.vars) — never commit real values.
  CROMA_API_KEY: string;
  GEMINI_API_KEY: string;
  AGENT_INGEST_KEY: string;

  // Vars.
  WEB_API_URL: string;
  /** Gemini model overrides; defaults live in workflow.ts (lineup drifts fast). */
  GEMINI_SWEEP_MODEL?: string;
  GEMINI_SCORING_MODEL?: string;
  /** "1" → offline demo fixtures instead of live Croma. */
  CROMA_STUB?: string;
}
