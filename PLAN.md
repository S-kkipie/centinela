# Centinela — Plan maestro (orquestación paralela)

Fecha: 2026-08-15. Deadline hackathon: 2026-08-16 (+ ventana extendida ~10 días).
Contexto y decisiones: `CONTEXT.md`. Arquitectura: `AGENTS.md`.

## Modelo de trabajo

- **Orquestador**: sesión principal (esta). Única que mergea a `main`. Revisa
  cada rama antes de merge, resuelve conflictos, mantiene contratos.
- **3 peers** en paralelo, cada uno en su **git worktree + rama propia**
  (skill `superpowers:using-git-worktrees`). Nadie toca `main` directo.
- Cada peer arranca con `superpowers:brainstorming` con Diego antes de codear,
  luego TDD (`superpowers:test-driven-development`).
- Al terminar (tests verdes): avisar al orquestador vía SendMessage con nombre
  de rama → orquestador revisa y mergea.
- Regla de conflictos: **no editar archivos fuera de tu workstream**. Si
  necesitas cambiar un contrato compartido, avisa al orquestador primero.

## Workstreams

### WS1 — `packages/croma` (rama `feat/croma-client`) — peer: centinela-b6

Cliente REST tipado para los 9 endpoints Colombia de Croma
(`https://api.croma.run`, Bearer `CROMA_API_KEY`, envelope `{ data }`,
rate limit 100/min). **Es el core: la centralidad Croma pesa en el jurado.**

- Paquete workspace `@centinela/croma` (sin deps runtime pesadas; fetch nativo,
  corre en Workers Y en Node).
- Validar 1 endpoint vivo primero (secop-processes-by-entity), luego tipar el
  resto: secop, rues, supersociedades, rama-judicial, sanciones, etc. (mapa de
  endpoints en `AGENTS.md`).
- Rate-limiter incorporado + reintentos + errores tipados.
- Exportar tipos limpios: `Tender`, `CompanyRecord`, `JudicialProcess`,
  `Sanction` — WS2 y WS3 los consumen.

### WS2 — web: schema + API + dashboard (rama `feat/web-core`) — peer: centinela-dc

En `apps/web` (Next 16 · Elysia · Better Auth · Drizzle · Supabase).

- Schema Drizzle: `watchlists`, `findings`, `graph_edges` — clonar patrón del
  dominio `Project` en `src/core/`. Migraciones con DIRECT_URL.
- API Elysia:
  - **Contrato ingest** (lo consume WS3): `POST /api/agent/findings`, auth por
    header `x-agent-key` (secret compartido), body = `Finding` (ver contratos).
  - Endpoints de lectura para dashboard: feed de findings, watchlist CRUD,
    edges del grafo.
- Dashboard: feed vivo de findings (polling primero; WebSocket `useAgent`
  después) + vista grafo red de contratistas (React Flow o Sigma.js).

### WS3 — agente vivo (rama `feat/agent-loop`) — peer: centinela-ba

En `apps/agent` (CF Agents SDK · Durable Objects · Queues · Workflows).

- Heartbeat: alarm del DO → `sweep()` real: por cada entidad vigilada,
  `secop-processes-by-entity`, detectar tenders nuevos (estado en SQLite del DO).
- Fan-out: 1 mensaje de Queue = 1 tender (respeta cap 50 subrequests).
- Consumer/Workflow por tender: cruce Croma
  (secop → rues → supersociedades → rama-judicial → sanciones) → Gemini
  (2.5 Flash sweep / Pro scoring, responseSchema JSON) → clasifica
  OPORTUNIDAD | BANDERA_ROJA con evidencia citada.
- Persistir: `POST` al ingest de WS2 (Worker no tiene driver PG).
- Hasta que WS1 publique: **stub del cliente Croma** con la interfaz de
  contratos abajo; swap al paquete real al merge.

## Contratos compartidos (dueño: orquestador — cambios se piden, no se hacen)

```ts
// @centinela/croma (WS1 publica, WS2/WS3 consumen)
interface CromaClient {
  secop: { processesByEntity(entityId: string, opts?: PageOpts): Promise<Tender[]> };
  rues: { lookup(nit: string): Promise<CompanyRecord | null> };
  supersociedades: { company(nit: string): Promise<FinancialRecord | null> };
  ramaJudicial: { processesByParty(nit: string): Promise<JudicialProcess[]> };
  sanciones: { byNit(nit: string): Promise<Sanction[]> };
}

// POST /api/agent/findings (WS2 implementa, WS3 llama)
// header: x-agent-key: <AGENT_INGEST_KEY>
interface FindingIngest {
  tenderId: string;
  entityId: string;
  entityName: string;
  kind: "OPORTUNIDAD" | "BANDERA_ROJA";
  score: number;            // 0-100
  title: string;            // titular corto
  summary: string;          // narrativa Gemini
  evidence: Array<{ source: string; url?: string; claim: string }>;
  graphEdges: Array<{ from: string; to: string; relation: string }>;
  raw?: unknown;            // payload crudo por si acaso
}
```

Si un campo no cuadra durante el build: mensaje al orquestador, se ajusta el
contrato aquí, se avisa a los 3.

## Orden de merge previsto

1. WS1 (`feat/croma-client`) — desbloquea tipos reales.
2. WS2 (`feat/web-core`) — desbloquea ingest real.
3. WS3 (`feat/agent-loop`) — cierra el loop end-to-end.

Luego (post-merge, orquestador coordina): alertas email/WhatsApp, reportes
públicos compartibles, demo para el jurado.
