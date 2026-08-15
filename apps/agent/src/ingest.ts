/**
 * Persistence bridge — the Worker holds no Postgres driver, so findings reach
 * the DB via the web Elysia API (WS2): `POST /api/agent/findings` authenticated
 * with the shared `x-agent-key` secret. Body is the `FindingIngest` contract.
 */
import type { FindingIngest } from "@centinela/contracts/finding";

export interface IngestConfig {
  /** Base URL of the web app, e.g. http://localhost:3000 (no trailing path). */
  url: string;
  /** Shared secret sent as the x-agent-key header. */
  key: string;
}

export async function ingestFinding(
  finding: FindingIngest,
  cfg: IngestConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const base = cfg.url.replace(/\/+$/, "");
  const res = await fetchImpl(`${base}/api/agent/findings`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-agent-key": cfg.key },
    body: JSON.stringify(finding),
  });
  if (!res.ok) {
    throw new Error(`finding ingest HTTP ${res.status}: ${await res.text()}`);
  }
}
