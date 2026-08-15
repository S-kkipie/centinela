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
import {
  DEFAULT_WATCH_TARGET_KIND,
  MAX_ENQUEUE_PER_SWEEP,
  type WatchTarget,
} from "@centinela/contracts/watch";
import { contractsToTenders } from "./contractor.ts";
import { detectNewTenders, type SeenMap } from "./detect.ts";
import { createCromaClient } from "./croma-stub.ts";
import type { Env, TenderMessage } from "./env.ts";

export { InvestigateTender } from "./workflow.ts";

/** Heartbeat cadence. */
// Croma caps each endpoint at 500 req/24h. 12 sweeps/day × ~40 targets stays
// inside the sweep endpoint's budget; every-15-min would blow it at 6 targets.
// The arithmetic lives in @centinela/contracts/watch so the console can show it.
const HEARTBEAT_CRON = "0 */2 * * *";
/** One sendBatch = one subrequest; keep batches well under the 100-msg limit. */
const QUEUE_BATCH_SIZE = 100;
/** Only sweep tenders published in this window (cold-start guard). */
const SWEEP_WINDOW_DAYS = 3;

type State = {
  /**
   * Legacy field: entity NITs, before targets could be contractors. Kept so a
   * Durable Object that has been alive across the deploy is migrated on read
   * instead of silently losing everything it was watching.
   */
  watchedEntities?: string[];
  /** What to sweep, and how. */
  targets?: WatchTarget[];
  lastSweepAt: number | null;
};

/** Reads either state shape; legacy entries become contracting entities. */
function readTargets(state: State): WatchTarget[] {
  if (state.targets) return state.targets;
  return (state.watchedEntities ?? []).map((nit) => ({
    nit,
    name: nit,
    kind: DEFAULT_WATCH_TARGET_KIND,
  }));
}

export class CentinelaAgent extends Agent<Env, State> {
  initialState: State = { targets: [], lastSweepAt: null };

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
   *   POST …/watch {"targets": [{nit,name,kind}, …]} → watched list
   *   POST …/watch {"entities": ["<nit>", …]}        → legacy, all contratante
   *   POST …/sweep                                   → {"enqueued": n}
   *   GET  …/status                                  → current state
   */
  async onRequest(request: Request): Promise<Response> {
    if (request.headers.get("x-agent-key") !== this.env.AGENT_INGEST_KEY) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const path = new URL(request.url).pathname;
    if (request.method === "POST" && path.endsWith("/watch")) {
      const body = (await request.json()) as {
        targets?: WatchTarget[];
        entities?: string[];
      };
      const targets =
        body.targets ??
        (body.entities ?? []).map((nit) => ({
          nit,
          name: nit,
          kind: DEFAULT_WATCH_TARGET_KIND,
        }));
      return Response.json({ watched: await this.watch(targets) });
    }
    if (request.method === "POST" && path.endsWith("/sweep")) {
      return Response.json(await this.sweep());
    }
    if (request.method === "GET" && path.endsWith("/status")) {
      return Response.json(this.state);
    }
    return Response.json({ error: "not found" }, { status: 404 });
  }

  /**
   * Add targets to the sweep (callable via the Agents RPC/HTTP surface).
   * Merged by NIT; a re-add updates the name and kind so a target filed under
   * the wrong side of the contract can be corrected by adding it again.
   */
  async watch(targets: WatchTarget[]): Promise<WatchTarget[]> {
    const merged = new Map(readTargets(this.state).map((t) => [t.nit, t]));
    for (const target of targets) merged.set(target.nit, target);
    const next = [...merged.values()];
    this.setState({ ...this.state, targets: next, watchedEntities: undefined });
    return next;
  }

  /** Heartbeat tick: diff the firehose and fan new tenders onto the queue. */
  async sweep(): Promise<{ enqueued: number; detected: number }> {
    const croma = createCromaClient(this.env);
    const messages: Array<{ body: TenderMessage }> = [];

    const from = new Date(Date.now() - SWEEP_WINDOW_DAYS * 86_400_000)
      .toISOString()
      .slice(0, 10);

    for (const target of readTargets(this.state)) {
      // One request per target per tick, whichever kind — the budget in
      // @centinela/contracts/watch assumes exactly this.
      const tenders =
        target.kind === "contratista"
          ? contractsToTenders(
              await croma.secopContractsByProvider(target.nit),
              target,
            )
          : await croma.secopProcessesByEntity(target.nit, { from, pageSize: 500 });

      const { newTenders, nextSeenMap } = detectNewTenders(
        tenders,
        this.loadSeen(target.nit),
      );
      this.saveSeen(target.nit, nextSeenMap);
      for (const tender of newTenders) messages.push({ body: { tender } });
    }

    const capped = messages.slice(0, MAX_ENQUEUE_PER_SWEEP);
    for (let i = 0; i < capped.length; i += QUEUE_BATCH_SIZE) {
      await this.env.CRAWL_QUEUE.sendBatch(capped.slice(i, i + QUEUE_BATCH_SIZE));
    }

    this.setState({ ...this.state, lastSweepAt: Date.now() });
    return { enqueued: capped.length, detected: messages.length };
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
