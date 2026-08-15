/**
 * Centinela — the living agent (Cloudflare Agents SDK + Durable Objects).
 *
 * One DO instance per user/watchlist holds the sweep memory (seen tenders) in
 * SQLite and wakes on a cron heartbeat. Each `sweep()` diffs the SECOP firehose
 * for every watched entity, then fans the genuinely-new tenders out onto a Queue
 * — one message per tender — which a consumer turns into an `InvestigateTender`
 * Workflow run. The reasoning lives in the pure modules; this file is wiring.
 */
import { Agent, routeAgentRequest } from "agents";
import { detectNewTenders, type SeenMap } from "./detect.ts";
import { createCromaClient } from "./croma-stub.ts";
import type { Env, TenderMessage } from "./env.ts";

export { InvestigateTender } from "./workflow.ts";

/** Heartbeat cadence. */
// Croma caps each endpoint at 500 req/24h. 12 sweeps/day × ~40 entities stays
// inside the sweep endpoint's budget; every-15-min would blow it at 6 entities.
const HEARTBEAT_CRON = "0 */2 * * *";
/** One sendBatch = one subrequest; keep batches well under the 100-msg limit. */
const QUEUE_BATCH_SIZE = 100;

type State = {
  /** SECOP entity NITs to sweep each heartbeat. */
  watchedEntities: string[];
  lastSweepAt: number | null;
};

export class CentinelaAgent extends Agent<Env, State> {
  initialState: State = { watchedEntities: [], lastSweepAt: null };

  async onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS seen (
      entity TEXT NOT NULL,
      notice TEXT NOT NULL,
      hash   TEXT NOT NULL,
      PRIMARY KEY (entity, notice)
    )`;
    // Self-heal the heartbeat: schedule the cron once, idempotently.
    if (this.getSchedules({ type: "cron" }).length === 0) {
      await this.schedule(HEARTBEAT_CRON, "sweep");
    }
  }

  /**
   * HTTP surface (routed by `routeAgentRequest` to
   * `/agents/centinela-agent/<instance>/…`), guarded by the shared agent key:
   *   POST …/watch {"entities": ["<nit>", …]} → watched list
   *   POST …/sweep                            → {"enqueued": n}
   *   GET  …/status                           → current state
   */
  async onRequest(request: Request): Promise<Response> {
    if (request.headers.get("x-agent-key") !== this.env.AGENT_INGEST_KEY) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const path = new URL(request.url).pathname;
    if (request.method === "POST" && path.endsWith("/watch")) {
      const body = (await request.json()) as { entities?: string[] };
      const watched = await this.watch(body.entities ?? []);
      return Response.json({ watched });
    }
    if (request.method === "POST" && path.endsWith("/sweep")) {
      return Response.json(await this.sweep());
    }
    if (request.method === "GET" && path.endsWith("/status")) {
      return Response.json(this.state);
    }
    return Response.json({ error: "not found" }, { status: 404 });
  }

  /** Add entities to the watchlist (callable via the Agents RPC/HTTP surface). */
  async watch(entityNits: string[]): Promise<string[]> {
    const merged = new Set([...this.state.watchedEntities, ...entityNits]);
    this.setState({ ...this.state, watchedEntities: [...merged] });
    return this.state.watchedEntities;
  }

  /** Heartbeat tick: diff the firehose and fan new tenders onto the queue. */
  async sweep(): Promise<{ enqueued: number }> {
    const croma = createCromaClient(this.env);
    const messages: Array<{ body: TenderMessage }> = [];

    for (const entity of this.state.watchedEntities) {
      const tenders = await croma.secopProcessesByEntity(entity, { pageSize: 500 });
      const { newTenders, nextSeenMap } = detectNewTenders(tenders, this.loadSeen(entity));
      this.saveSeen(entity, nextSeenMap);
      for (const tender of newTenders) messages.push({ body: { tender } });
    }

    for (let i = 0; i < messages.length; i += QUEUE_BATCH_SIZE) {
      await this.env.CRAWL_QUEUE.sendBatch(messages.slice(i, i + QUEUE_BATCH_SIZE));
    }

    this.setState({ ...this.state, lastSweepAt: Date.now() });
    return { enqueued: messages.length };
  }

  private loadSeen(entity: string): SeenMap {
    const rows = this.sql<{ notice: string; hash: string }>`
      SELECT notice, hash FROM seen WHERE entity = ${entity}
    `;
    const map: SeenMap = {};
    for (const row of rows) map[row.notice] = row.hash;
    return map;
  }

  private saveSeen(entity: string, map: SeenMap): void {
    for (const [notice, hash] of Object.entries(map)) {
      this.sql`
        INSERT INTO seen (entity, notice, hash) VALUES (${entity}, ${notice}, ${hash})
        ON CONFLICT (entity, notice) DO UPDATE SET hash = excluded.hash
      `;
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routeAgentRequest(request, env)) ??
      new Response("centinela-agent up", { status: 200 })
    );
  },

  /** One message = one tender → one durable investigation Workflow run. */
  async queue(batch: MessageBatch<TenderMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await env.INVESTIGATE.create({ params: { tender: message.body.tender } });
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env, TenderMessage>;
