# Centinela Copilot — CopilotKit v2 Integration Design

**Date:** 2026-08-15 · **Status:** Draft for review · **Deadline context:** IA-Hackathon GOV-TECH by Croma (2026-08-16)

## 1. Purpose & value proposition

Centinela's living agent sweeps SECOP every 2h and publishes findings to the Panel.
The Copilot closes the interaction loop: a conversational analyst **inside** the app
that can *read* everything the agent found and *drive* the UI on the user's behalf.

Pitch line: *"El agente barre solo cada 2 horas; el copiloto te deja interrogar lo
que encontró — con evidencia citada — y ordenarle qué vigilar, hablando."*

Value pillars (priority order for the demo):

1. **Interrogate findings** — "¿Por qué bandera roja este proceso?" → generative
   `EvidenceCard` in chat: verdict, cited evidence chain (RUES, Rama Judicial,
   sanciones…) with source links, score breakdown. Grounded in real `Finding.evidence`,
   never hallucinated.
2. **Intent navigation** — "Muéstrame banderas de salud de esta semana" → the copilot
   filters the real inbox and navigates. The panel visibly moves by itself.
3. **NL watchlist onboarding (human-in-the-loop)** — "Vigila infraestructura en
   Medellín" → copilot proposes a watchlist + entities in a `WatchlistPreviewCard`
   with Confirm/Cancel; DB writes happen only after explicit confirmation.
4. *(stretch)* **Network detective** — focus/trace NITs on the contractor graph.
5. *(stretch)* **Opportunity comparator** — side-by-side `CompareCard` of OPORTUNIDAD
   findings.

## 2. Constraints & decisions already locked

- CopilotKit **v2 API** (`@copilotkit/react-core/v2`, `@copilotkit/react-ui/v2`).
  `useCopilotAction` is v1; v2 replaces it with `useFrontendTool` (zod params).
- Backend: **`BuiltInAgent`** from `@copilotkit/runtime/v2` with
  `model: "google:gemini-2.5-flash"` — reuses the existing `GEMINI_API_KEY`, zero new
  infra. AG-UI bridge to the CF Durable Object agent is explicitly out of scope
  (phase 2 after the hackathon).
- Execution: 3 parallel peer sessions (centinela-b6 / -dc / -ba) with the
  orchestrator owning contracts, mirroring the earlier parallel build. Disjoint file
  ownership per workstream; orchestrator merges and runs the gate.

## 3. Architecture

```
apps/web
├─ src/app/api/copilotkit/route.ts        ← CopilotRuntime + BuiltInAgent (WS-A)
├─ src/app/(app)/layout.tsx               ← <CopilotSidebar> mount (WS-A)
├─ src/frontend/providers/providers.tsx   ← <CopilotKit runtimeUrl> wrapper (WS-A)
└─ src/core/copilot/client/
   ├─ store.ts                            ← shared UI-command store (CONTRACT, orchestrator)
   ├─ context/use-copilot-app-context.ts  ← useAgentContext feeds (WS-B)
   ├─ tools/use-finding-tools.tsx         ← filterFindings, openFinding, explainFinding (WS-B)
   ├─ tools/use-watchlist-tools.tsx       ← proposeWatchlist HITL (WS-C)
   └─ ui/
      ├─ evidence-card.tsx                ← generative UI (WS-B)
      └─ watchlist-preview-card.tsx       ← HITL confirm card (WS-C)
```

Data flow:

1. `useAgentContext` continuously exposes app state (selected watchlist, active
   filters, visible findings digest, open finding) to the LLM.
2. User asks in the sidebar → BuiltInAgent (Gemini) decides → calls a frontend tool.
3. Tool handlers run in the browser: they mutate the copilot store (which page
   components subscribe to), call existing react-query hooks/mutations, or return
   data that the tool's `render` shows as generative UI in the chat.
4. HITL tools pause the agent until the user clicks Confirm/Cancel in the rendered
   card (`useHumanInTheLoop` `respond` callback).

## 4. Contract: copilot store (orchestrator-owned)

`apps/web/src/core/copilot/client/store.ts` — plain React context + reducer (no new
dependency; zustand rejected to keep the dep surface unchanged). Written **first**,
before workstreams start; peers treat it as read-only.

```ts
export type FindingFilter = {
    kind?: "OPORTUNIDAD" | "BANDERA_ROJA";
    watchlistId?: string;
    entityQuery?: string;   // substring match on entityName
    sinceDays?: number;     // e.g. 7 = "esta semana"
};

export type CopilotUiState = {
    findingFilter: FindingFilter | null;  // null = no copilot override
    focusFindingId: string | null;        // feed scroll/highlight target
};

export type CopilotUiApi = {
    state: CopilotUiState;
    setFindingFilter(f: FindingFilter | null): void;
    focusFinding(id: string | null): void;
};

export function CopilotUiProvider(props: { children: React.ReactNode }): JSX.Element;
export function useCopilotUi(): CopilotUiApi;
```

`Dashboard`/`FindingsFeed` read `findingFilter` and apply it client-side on top of
the already-polled feed (50 items in cache — filtering in memory is enough for the
demo; no API changes). `focusFindingId` scrolls/flashes the matching row.

## 5. Runtime, provider & custom chat shell (WS-A · centinela-b6)

**Decision: NO CopilotKit prebuilt UI.** `CopilotSidebar`/`CopilotChat` are rejected
on looks. Chat surface is built from **Vercel AI Elements** (shadcn registry —
components land as code in the repo, restyled with the dark-ops tokens) driven by
CopilotKit v2 **headless hooks** (`useAgent` for messages/sendMessage/state,
`message.generativeUI?.()` for tool renders). Rejected alternatives: assistant-ui
(brings its own runtime, conflicts with CopilotRuntime), prompt-kit (same niche,
less maintained). `@copilotkit/react-ui` stays installed but unused (fallback only).

**Files owned:** `src/app/api/copilotkit/route.ts`, `src/frontend/providers/providers.tsx`,
`src/app/(app)/layout.tsx`, `src/core/copilot/client/ui/chat-panel.tsx`,
`src/frontend/components/ai-elements/*` (shadcn CLI output), globals.css additions.

- Route handler: `CopilotRuntime` + `createCopilotEndpoint` (from
  `@copilotkit/runtime/v2`, verified export) + `BuiltInAgent({ model:
  "google:gemini-2.5-flash" })`. Guard with the same Better Auth session check used
  elsewhere; 401 otherwise.
- System prompt (in `BuiltInAgent` config): Spanish (es-CO), role = analista de
  contratación pública de Centinela, instructed to ground every claim about a
  finding in the provided context/evidence and to prefer calling tools over prose
  when the user asks to see/filter/open things.
- `<CopilotKitProvider runtimeUrl="/api/copilotkit">` wraps only the authenticated
  `(app)` tree; `CopilotUiProvider` (contract) mounted alongside.
- `chat-panel.tsx`: collapsible right-side panel in `(app)/layout.tsx`. AI Elements
  `Conversation` + `Message` + `PromptInput` (+ `Suggestion` chips seeded with demo
  prompts), es-CO labels ("Copiloto Centinela", "Pregunta por un hallazgo…"),
  dark-ops styling. Assistant messages render `message.generativeUI?.()` so every
  workstream's tool cards appear in the thread.
- Install AI Elements pieces via `npx shadcn@latest add` from the AI Elements
  registry (Tailwind v4 + React 19 + new-york style already configured in
  `components.json`).

Acceptance: panel renders on /dashboard and /watchlists behind auth; a plain
question round-trips to Gemini and answers in Spanish; a registered tool's render
shows inside the thread; unauthenticated POST to /api/copilotkit → 401.

## 6. Finding tools + context + EvidenceCard (WS-B · centinela-dc)

**Files owned:** `src/core/copilot/client/context/use-copilot-app-context.ts`,
`src/core/copilot/client/tools/use-finding-tools.tsx`,
`src/core/copilot/client/ui/evidence-card.tsx`, plus minimal edits to
`src/core/finding/client/ui/dashboard.tsx` / `findings-feed.tsx` to consume
`useCopilotUi` (filter + focus).

Context (`useAgentContext`), refreshed from existing react-query caches:

- `watchlists`: id + name list.
- `selectedWatchlist`: id + name.
- `visibleFindings`: digest of current feed items — id, title, entityName, kind,
  score, createdAt (NOT full evidence; keeps prompt small, ~50 items max).
- `activeFilter`: current `FindingFilter`.

Tools (all `useFrontendTool`, zod params):

| Tool | Params | Handler effect | render |
|---|---|---|---|
| `filterFindings` | `{ kind?, entityQuery?, sinceDays?, watchlistId? }` | `setFindingFilter(...)`; if route ≠ /dashboard, `router.push("/dashboard")` | one-line confirmation ("Filtrando: banderas · salud · 7d") |
| `clearFilter` | `{}` | `setFindingFilter(null)` | — |
| `openFinding` | `{ findingId }` | `focusFinding(id)` + navigate to /dashboard; feed scrolls & expands the row | brief status line |
| `explainFinding` | `{ findingId }` | look up finding in react-query cache (fallback: refetch feed); return `{ finding }` | **`EvidenceCard`** |

`EvidenceCard` (generative UI): kind badge (OPORTUNIDAD verde / BANDERA_ROJA roja),
score, title, summary (Gemini verdict), evidence list — each `FindingEvidence` as
`source · claim` with external link when `url` present — reusing existing badge/card
styles from the feed. This is the demo's money shot: cited 9-source evidence chain
rendered inside chat.

Acceptance: "muéstrame solo banderas rojas de esta semana" filters the real feed;
"¿por qué es bandera roja?" (with a finding open or named) renders EvidenceCard with
real evidence links; context keeps "este proceso" resolvable.

## 7. Watchlist HITL tools + preview card (WS-C · centinela-ba)

**Files owned:** `src/core/copilot/client/tools/use-watchlist-tools.tsx`,
`src/core/copilot/client/ui/watchlist-preview-card.tsx`.

Single HITL tool `proposeWatchlist` via `useHumanInTheLoop`:

- Params (zod): `{ name: string, entities: Array<{ nit: string, entityName: string }> }`.
  The LLM builds the proposal from conversation (user may paste NITs, or name known
  entities from context). The tool does NOT invent NITs: system prompt instructs the
  agent to ask the user for NITs it does not have grounded in context.
- `render` states: `inProgress` → skeleton; `executing` → `WatchlistPreviewCard`
  (name + entity rows + Confirmar / Cancelar buttons wired to `respond`);
  `complete` → summary of what was created.
- On Confirm: run existing `useWatchlistMutations().create` then `addEntity` per
  row (mutations already invalidate react-query caches → Vigiladas page updates
  live). On Cancel: `respond({ cancelled: true })`, no writes.
- Also `addEntitiesToWatchlist` HITL variant for extending an existing watchlist
  (same card, reuses `useWatchlist` for current entities).

Acceptance: "vigila la Alcaldía de Medellín, NIT 890905211" → card appears, nothing
written until Confirmar; after confirm the watchlist exists in /watchlists; Cancelar
writes nothing.

## 8. Error handling

- Tool handlers never throw raw: catch, return `{ error: string }` so the agent can
  apologize in Spanish and suggest a retry.
- `explainFinding` with unknown id → `{ error: "hallazgo no encontrado" }`.
- Runtime route failures (Gemini quota) surface as chat error message; the app
  itself is unaffected (copilot is additive, no existing path depends on it).
- HITL cards must be idempotent: double-click Confirm guarded by pending state.

## 9. Testing

- Unit (vitest, existing setup): store reducer; zod schemas of each tool (param
  parsing, rejection); `filterFindings` handler applies expected `FindingFilter`;
  `proposeWatchlist` confirm path calls mutations with right payloads (mocked).
- Existing suites must stay green: `pnpm turbo test typecheck` is the merge gate.
- Manual smoke script (demo rehearsal): the three acceptance flows above, in order.

## 10. Workstream plan (4 parallel: 3 peers + orchestrator)

| WS | Owner | Scope | Files (disjoint) |
|---|---|---|---|
| A | centinela-b6 | runtime + provider + sidebar + theme + auth guard + system prompt | route.ts, providers.tsx, (app)/layout.tsx, globals.css |
| B | centinela-dc | watchlist HITL tools + preview card | core/copilot/client/{tools/use-watchlist-tools,ui/watchlist-preview-card} |
| C | centinela-ba | graph tools (focusNode, traceRelation) + CompareCard | core/copilot/client/{tools/use-graph-tools,ui/compare-card}, finding/client/ui/contractor-graph.tsx edits |
| D | orchestrator | store contract + app context + finding tools + EvidenceCard + feed/dashboard integration + final merge & gate | core/copilot/client/{store.ts,context,tools/use-finding-tools,ui/evidence-card}, finding/client/ui/{dashboard,findings-feed}.tsx edits |

Sequencing: orchestrator installs CopilotKit deps and writes `store.ts` contract on
main first; all four workstreams then run in parallel on disjoint files (peer hooks
are inert until mounted); WS-A mounts everything. All work is TDD (tests first).
Orchestrator integrates, resolves `layout.tsx` mount order, runs
`pnpm turbo test typecheck` gate, commits. Peer communication is exclusively
orchestrator ↔ peer.

Graph tool contract additions (WS-C consumes, orchestrator owns in `store.ts`):
`focusNit: string | null` + `focusNit(nit)` — `contractor-graph.tsx` centers/
highlights that node; `traceRelation` renders its path as generative UI from the
already-polled `Graph` edges.

Out of scope (post-hackathon backlog): AG-UI bridge to the CF DO agent, suggestions
(`useConfigureSuggestions`), threads persistence.
