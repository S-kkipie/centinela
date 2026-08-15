import { Agent, routeAgentRequest } from "agents";

export interface Env {
  CentinelaAgent: DurableObjectNamespace<CentinelaAgent>;
  // TODO: CRAWL_QUEUE (Queue), INVESTIGATE (Workflow), CROMA_API_KEY, GEMINI_API_KEY, WEB_API_URL
}

/** Per-user living agent. One Durable Object instance per watchlist. */
type State = {
  watchedEntities: string[]; // SECOP entity NITs to sweep each heartbeat
  lastSweepAt: number | null;
};

export class CentinelaAgent extends Agent<Env, State> {
  initialState: State = { watchedEntities: [], lastSweepAt: null };

  async onStart() {
    // Heartbeat: wake the agent on an interval to sweep the firehose.
    // TODO: schedule sweep; see agents SDK this.schedule(...)
  }

  /** Heartbeat tick. */
  async sweep() {
    // TODO:
    // 1. fan-out watchedEntities -> CRAWL_QUEUE (secop-processes-by-entity)
    // 2. per new tender -> INVESTIGATE workflow: cruza Croma (secop->rues->super->judicial->sanciones)
    // 3. Gemini scoring (responseSchema JSON) -> OPORTUNIDAD | BANDERA ROJA + cadena de evidencia
    // 4. persist findings (D1) + graph edges; stream to dashboard via state
    this.setState({ ...this.state, lastSweepAt: Date.now() });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routeAgentRequest(request, env)) ??
      new Response("centinela-agent up", { status: 200 })
    );
  },
} satisfies ExportedHandler<Env>;
