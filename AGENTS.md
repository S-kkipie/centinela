# AGENTS.md — Centinela

Context for AI agents (and humans) working in this repo.

## What this is

Autonomous agent over Colombian public-procurement data (SECOP) via the Croma
API. Two faces from one engine: **opportunity** (help an SME win winnable
tenders) and **watchdog** (expose rigged awards). Hackathon: IA-Hackathon
GOV-TECH by Croma.

Judging criteria — optimize for all three:
1. **Originality** — a *living* autonomous agent, not a query tool.
2. **Croma integration** — Croma is the core of every loop iteration (max
   endpoint chaining). This is weighted heavily.
3. **Impact / production-readiness** — deployed, live data, real problem.

Design guardrail: this must NOT collapse into "an MCP plugged into a chatbot"
(no moat) nor "passive monitoring you pay a subscription for and never feel"
(insurance trap). The agent **initiates** (heartbeat) and delivers **felt
value**: a contract won, or theft exposed.

## Architecture

Turborepo, pnpm. Two apps.

### `apps/agent` — the living agent (Cloudflare)
- **Agents SDK** `Agent` class = a **Durable Object** with SQLite memory. One
  instance per user/watchlist. Persistent across heartbeats.
- **Heartbeat** via DO `alarm` / `this.schedule()` → `sweep()`.
- **Queues** fan out the sweep across watched SECOP entities (respect Croma
  rate limit: 100/min).
- **Workflows** run each tender investigation as durable multi-step execution
  (auto-retry on Croma failures).
- **Gemini** (latest, e.g. 2.5 Flash for sweep / Pro for hard scoring) does ReAct reasoning + **structured-output**
  scoring with a cited evidence chain. Follows threads (e.g. new-company
  provider → its legal reps in RUES → same reps winning elsewhere).
- Entry: `src/index.ts` (`CentinelaAgent` class + worker `fetch` via
  `routeAgentRequest`). Config: `wrangler.jsonc`.

### `apps/web` — dashboard + API + auth
- The `hackaton-starter`: **Next 16 · Elysia (`/api/v1`) · Better Auth ·
  Drizzle/Postgres · Eden + TanStack Query · shadcn/ui + Tailwind v4 · Biome ·
  Vitest**. Result-pattern response envelope; `Project` CRUD is the reference
  domain to clone for new domains (watchlists, findings).
- **App DB = Supabase Postgres** (free). Starter's `pg` +
  `drizzle-orm/node-postgres` connect unchanged — `DATABASE_URL` points at the
  Supabase session-pooler connection string (plain Postgres, not supabase-js).
  Owns users, watchlists, findings, graph edges.
- The agent (Worker) does NOT hold a Postgres driver: it **persists via the
  web Elysia API** (HTTP). Agent memory stays in DO SQLite. (Optional later:
  direct Worker→Cockroach via Hyperdrive.)
- Dashboard streams **live agent state** via `useAgent` (agents/react) over
  WebSocket → the demo centerpiece: watch the agent think and *initiate*.
- **Contractor-network graph** (React Flow / Sigma.js): who wins with whom,
  shared legal reps.

## Croma API

- Base: `https://api.croma.run` · POST · `Authorization: Bearer croma_live_…`
  · responses wrapped under `data` · rate limit 100/min · MCP at
  `/mcp-server`. Docs: https://docs.usecroma.com (`/llms.txt` for full index).
- Key: `platform.usecroma.com`. Keep in Secrets Store / `.dev.vars` — never
  commit.

Colombia endpoints the engine chains:

| Path | Input | Use |
|------|-------|-----|
| `secop-processes-by-entity` | entity NIT + date window | sweep new tenders |
| `secop-process-by-notice` | noticeUID | awards per provider, values |
| `secop-contracts-by-provider` | NIT/cédula | concentration = rigging signal |
| `secop-sanctions-by-provider` | NIT/cédula | red flag |
| `rues-entity-by-nit` | NIT | real? incorporation date, status, financials |
| `supersociedades-financial-statements` | NIT | capital vs contract mismatch |
| `rama-judicial-cases-by-entity` | name | litigation |
| `procuraduría-disciplinary-records` | doc | sanctioned contractor |
| `contraloría-fiscal-records` | doc | fiscal responsible |

## Conventions

- Package manager: **pnpm** (`pnpm -F <pkg> <script>`). Orchestrate with turbo.
- Web app follows starter conventions: Result envelope, Elysia at `/api/v1`,
  Drizzle schema in `apps/web/drizzle`, Biome for lint/format.
- Tests live in `__tests__/` directories.
- Do not re-export types; import from the defining module.
- Secrets via env / Secrets Store only.

## Build order (suggested)

1. Croma REST client + typed wrappers for the 9 endpoints above.
2. Agent `sweep()` → Queue fan-out → Workflow investigation → scoring.
3. Persist findings + graph edges (Supabase Postgres + Drizzle, via web API).
4. Dashboard: live agent feed (WebSocket) + graph.
5. Alerts (email / WhatsApp) + shareable public watchdog reports.

## Status

Scaffold only. Everything above the Croma client is stubbed (`sweep()` in
`apps/agent/src/index.ts`).
