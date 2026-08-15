# Centinela

Autonomous govtech agent for Colombian public procurement (SECOP). A living
agent that **hunts winnable tenders** for honest SMEs and **exposes rigged
awards** — two faces of one cross-referencing engine over
[Croma](https://usecroma.com)'s official government data.

Built for the **IA-Hackathon GOV-TECH by Croma** (submission deadline
2026-08-16, extended to a 10-day window).

## The idea

A public tender ("licitación") is the state buying something and companies
competing for the contract. SECOP publishes hundreds daily — a firehose no
human can track. Centinela's agent wakes on a heartbeat, sweeps watched
contracting entities, and cross-references every new tender across Croma:

```
heartbeat (Durable Object alarm)
  -> Queue: fan-out watched entities (secop-processes-by-entity)
     -> Workflow per new tender: cruza Croma
          secop -> rues -> supersociedades -> rama-judicial -> sanciones
          -> Gemini: follow the thread + score
          -> OPORTUNIDAD (winnable)  |  BANDERA ROJA (rigged)
          -> persist (D1) + graph edge
  -> escalate relevant -> dashboard (WebSocket) + email / WhatsApp
```

- **Opportunity face** (pays: the SME): "this tender is winnable, weak
  competition — go for it."
- **Watchdog face** (viral narrative): "this award reeks — single bidder +
  provider incorporated 2 months ago + $2M" with a cited evidence chain.

Same analysis, two readings. Corruption detection *is* the competitive
intelligence.

## Monorepo

Turborepo + pnpm workspaces.

| Path | What | Stack |
|------|------|-------|
| `apps/web` | Dashboard + API + auth | Next 16 · Elysia · Better Auth · Drizzle + Supabase Postgres (the `hackaton-starter`) |
| `apps/agent` | The living agent | Cloudflare Agents SDK · Durable Objects · Workflows · Queues |

Full stack: Gemini (2.5 Flash/Pro) for reasoning + structured scoring · Croma
REST for gov data · Supabase Postgres + Drizzle for shared app data (agent
memory in DO SQLite) · React Flow / Sigma.js for the contractor-network graph ·
Cloudflare Email + WhatsApp Cloud API for alerts.

## Setup

```bash
pnpm install

# web (see apps/web/README.md for full setup)
cp apps/web/.env.example apps/web/.env   # DATABASE_URL, BETTER_AUTH_SECRET, ...

# agent
cp apps/agent/.dev.vars.example apps/agent/.dev.vars   # CROMA_API_KEY, GEMINI_API_KEY
```

## Dev

```bash
pnpm dev          # all apps via turbo
pnpm -F @centinela/web dev
pnpm -F @centinela/agent dev
```

## Deploy

```bash
pnpm -F @centinela/agent deploy   # wrangler deploy
# web: Cloudflare Pages / Vercel
```

## Status

Scaffold only. Agent loop, Croma integration, scoring, graph, and dashboard
are stubbed — see `AGENTS.md` for architecture and build plan.

## License

[GNU AGPL-3.0-only](./LICENSE). Because Centinela runs as a network service,
the AGPL's network clause applies: anyone who offers it over a network must
make the corresponding source available to its users.
