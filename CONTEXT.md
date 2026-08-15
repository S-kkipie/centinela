# Centinela — build context & decision log

Working notes so a fresh session (cwd in this folder) picks up instantly.
Architecture + Croma endpoint map live in `AGENTS.md`; product pitch in `README.md`.

## What Centinela is (locked)

Autonomous govtech agent over Colombian public procurement (SECOP) via the
**Croma** API, for the **IA-Hackathon GOV-TECH by Croma** (deadline 2026-08-16,
extended ~10-day window; single winner: $300 + 6mo Croma).

A **living agent** (heartbeat, not on-demand). Sweeps watched contracting
entities, cross-references each new tender across Croma
(secop → rues → supersociedades → rama-judicial → sanciones), Gemini scores it,
emits **two faces from one engine**:
- **OPORTUNIDAD** — help an honest SME win winnable tenders (the payer, upside $).
- **BANDERA ROJA** — expose rigged awards (viral watchdog narrative, cited
  evidence chain).

Judging criteria to optimize: originality · **Croma centrality (weighted)** ·
impact/production-readiness.

### Design guardrails (user insisted)
- NOT passive monitoring → insurance trap (invisible value, nobody pays).
- NOT on-demand query tool → "just an MCP in my Fable" (no moat).
- The agent must **initiate** (heartbeat) and deliver **felt value**
  (contract won / theft exposed). "Firehose" = SECOP's continuous tender stream
  no human can track.
- Ambition level chosen: **Techo** (full build).

## Stack decisions (final)

| Concern | Choice | Notes |
|---|---|---|
| Monorepo | Turborepo + pnpm | `apps/web`, `apps/agent` |
| Web (dashboard+API+auth) | `hackaton-starter` | Next16 · Elysia · Better Auth · Drizzle |
| App DB | **Supabase Postgres** | starter's pg+drizzle unchanged; runtime pooler 6543, migrations DIRECT_URL 5432 |
| Living agent | **Cloudflare Agents SDK + Durable Objects** | SQLite memory, heartbeat via alarm |
| Fan-out / durability | CF Queues + Workflows (Queues free 2026) | 1 msg = 1 tender = 1 invocation (50 subrequest cap) |
| LLM | **Gemini** (2.5 Flash sweep / Pro scoring) | responseSchema JSON; free tier; user chose over Anthropic |
| Gov data | **Croma REST** `https://api.croma.run` | Bearer, envelope `data`, 100/min |
| Graph | React Flow / Sigma.js | contractor network |
| Alerts | CF Email + WhatsApp Cloud API | later |
| Agent → DB | via web Elysia API | Worker holds no PG driver |

Cloudflare **free plan confirmed sufficient** (DO SQLite, Queues, alarms, cron
all free 2026). Only real cost = LLM tokens → Gemini free tier ≈ zero.

Rejected en route: D1 (starter schema rewrite), CockroachDB (user reversed),
PlanetScale (no free tier), Neon (slots), Hyperdrive (pooler not a host).

## Done (2026-08-15)

- Monorepo scaffolded; starter cloned into `apps/web` (`.git`/`cli` stripped,
  renamed `@centinela/web`).
- `apps/agent`: CF Agents SDK stub (`CentinelaAgent` DO + `sweep()` TODO),
  wrangler.jsonc (DO binding + sqlite migration), tsconfig, `.dev.vars`.
- Root: package.json, pnpm-workspace.yaml, turbo.json, .gitignore, README,
  AGENTS.md.
- `.env` files written (git-ignored): DATABASE_URL (6543) + DIRECT_URL (5432) +
  BETTER_AUTH_SECRET + NEXT_PUBLIC_APP_URL + GEMINI_API_KEY + CROMA_API_KEY.
- Migrations pointed at DIRECT_URL. `pnpm install` OK.
- **Smoke test green:** migrations applied to Supabase; web boots (Next 16,
  `GET / 307` auth guard).

## Secrets

In `apps/web/.env` and `apps/agent/.dev.vars` — **git-ignored, never commit**.
Keys were pasted in chat → **rotate before real production** (Croma, Gemini,
Supabase password).

## Done (2026-08-15, parallel build — 3 peer sessions + orchestrator)

All three workstreams merged to main; gate `pnpm turbo test typecheck` 8/8 green:

- `packages/contracts` (@centinela/contracts): shared FindingIngest +
  validateFindingIngest, CromaClient interface. Contracts are code; orchestrator
  owns changes.
- `packages/croma` (@centinela/croma): typed client, 9 endpoints, zod edges,
  token-bucket + retry/backoff, typed errors. Verified live. Real API shape:
  **POST /co/<source>/<name>/v1, 500 req/24h PER endpoint**, rama-judicial by
  entity NAME (resolve NIT→name via RUES first).
- `apps/web`: watchlists/watchlist_entities/findings/graph_edges schema
  (migration applied to Supabase), ingest `POST /api/agent/findings`
  (x-agent-key, outside /api/v1), read APIs, dashboard feed + React Flow graph.
- `apps/agent`: heartbeat → sweep → Queue (1 msg = 1 tender) → Workflow
  investigation (Croma cross-ref → Gemini Flash-Lite triage + Pro scoring,
  structured output) → POST ingest. Real croma client wired; `CROMA_STUB=1`
  runs offline empresa-fantasma demo. `wrangler deploy --dry-run` OK.
- graphEdges convention: from/to are NITs/documents, never display names.

## Smoke E2E (2026-08-15) — GREEN

Local: web :3000 + wrangler dev :8788 (8787 busy — unrelated bun service),
`CROMA_STUB=1` (offline fixtures) + REAL Gemini. Flow verified end-to-end:
signup → watchlist + entity NIT 899999061 → `POST
/agents/centinela-agent/<instance>/watch` + `/sweep` (x-agent-key) → queue →
workflow → Gemini scored BANDERA_ROJA 95 → ingest → finding + graph edges in
Supabase, readable via `/api/v1/findings` + `/api/v1/graph`. Second sweep:
enqueued 0 (seen-map dedup), still 1 finding (idempotent upsert).

Known noise: one "Workers runtime canceled this request … hung" log line after
the queue consumer in local dev — workflow completed and persisted fine; local
workflows-emulation noise, watch it on real deploy. Agent HTTP surface
(watch/sweep/status) added in a51bc0e. Pending: live-Croma smoke (drop
CROMA_STUB), deploy, pitch.

## Live-Croma smoke (2026-08-15) — GREEN

`CROMA_STUB` removed (note: wrangler dev does NOT hot-reload .dev.vars —
restart it). Real sweep on Alcaldía de Bogotá (899999061): **111 tenders
detected in a 3-day window**, capped at 25 investigations
(SWEEP_WINDOW_DAYS=3, MAX_ENQUEUE_PER_SWEEP=25 — cold-start guards, commit
0f07561). Real findings persisted end-to-end, both faces, e.g. BANDERA_ROJA 65
"historial judicial acumulado del contratista" and OPORTUNIDAD 85 low-risk
service contracts. Gemini triage skips boring tenders (skipped:true → no
ingest), so ingest count < enqueued is expected.

Fixed live: CO1.REQ.* sweep ids aren't valid notice UIDs for
/co/secop/process/v1 → secop-detail step now skips non-CO1.NTC.* ids (d72ef70).
Starter's Project domain removed entirely (19a5efc, migration 0002 applied).

## Design system "intel" (2026-08-15) — applied repo-wide

Locked in `/design.md` (source of truth; Hallmark-derived, chosen from 6 mocks
kept under `apps/web/public/mocks/`). Ops-grade govtech: light engineering-gray
paper, esmeralda accent (OPORTUNIDAD/primary), red reserved for BANDERA_ROJA,
Space Grotesk / Inter Tight / IBM Plex Mono (next/font), 32px grid substrate
(`.bg-grid-ops`), mono machine-data register (`.label-ops`). Tokens mapped onto
shadcn vars in globals.css (light + dark ops). Aceternity free components
(recolored to tokens) live in `src/frontend/components/aceternity/`; approved/
banned list in design.md. Landing pública en `/`; consola + auth + watchlists
restyled. biome ignores `public/mocks/**`. Commits 4feed22 + ab1517a.

## Next steps (in order)

1. **`packages/croma`** — typed REST client for the 9 Colombia endpoints
   (`api.croma.run`, Bearer, `data` envelope, rate-limit aware). Validate one
   live endpoint first, then type the rest. This is the core (Croma centrality).
2. Drizzle schema: `watchlists`, `findings`, `graph_edges` (clone `Project`
   domain pattern in `src/core/`).
3. Agent `sweep()` real → Queue fan-out → Croma cross-ref → Gemini scoring →
   persist via web API.
4. Dashboard live feed (`useAgent` WebSocket) + contractor-network graph.
5. Alerts (email/WhatsApp) + shareable public watchdog reports.

## Commands

```bash
pnpm install
pnpm -F @centinela/web dev            # dashboard :3000
pnpm -F @centinela/web db:generate    # after schema edits
pnpm -F @centinela/web db:migrate     # apply (uses DIRECT_URL)
pnpm -F @centinela/agent dev          # wrangler dev
pnpm -F @centinela/agent deploy
```
