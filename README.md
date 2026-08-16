<div align="center">

<img src="brand/mark-dark.svg" alt="Centinela" width="88" height="88">

# CENTINELA

**Vigilancia autónoma de la contratación pública colombiana.**

Un agente vivo que barre el SECOP, cruza cada proceso contra 9 fuentes oficiales
vía [Croma](https://usecroma.com), y expone lo que se esconde a plena vista —
dos caras de un mismo motor: **oportunidades** para PYMEs honestas y **banderas
rojas** con evidencia citada.

[**Producto en vivo → centinela.aido.lat**](https://centinela.aido.lat)

[![Licencia](https://img.shields.io/badge/licencia-AGPL--3.0-0C7A57)](./LICENSE)
[![Hackathon](https://img.shields.io/badge/IA--Hackathon-GOV--TECH%20·%20Croma-0C7A57)](https://usecroma.com/es/changelog/hackathon-govtech)
![Estado](https://img.shields.io/badge/estado-en%20producción-25CE93)

</div>

---

## El problema

El Estado colombiano publica **miles de contratos cada día** en el SECOP. Nadie
los lee todos — y ahí la corrupción no se esconde en secreto, se esconde en el
**volumen**, dispersa entre registros oficiales que nadie cruza. Mientras tanto,
la PYME honesta pierde contratos que sí podía ganar.

**La clave no es falta de datos. Es que nadie los encadena.** Un NIT en RUES,
unas finanzas en Supersociedades, un pleito en la Rama Judicial — por separado
no dicen nada. Cruzados, delatan.

## La solución

Centinela **no es un buscador**: es un agente que inicia. Late en un heartbeat,
barre las entidades y contratistas que vigilas, y por cada proceso nuevo
encadena Croma → Gemini pondera → emite un veredicto citado.

```
heartbeat (Durable Object · cada 2h)
  └─ Queue: un mensaje por proceso nuevo (secop-processes-by-entity)
       └─ Workflow por proceso: cruza Croma
            secop → rues → supersociedades → rama-judicial → procuraduría → contraloría
            └─ Gemini: sigue el hilo + puntúa
            └─ OPORTUNIDAD (ganable)  |  BANDERA_ROJA (riesgo)
            └─ persiste (Postgres) vía API web + aristas del grafo
  └─ Panel en vivo + copiloto que actúa
```

- **Cara oportunidad** — *paga* (la PYME): "este proceso es ganable, poca
  competencia, preséntate."
- **Cara watchdog** — *viral* (el ciudadano): "esto huele — proponente único +
  empresa constituida hace 2 meses + contrato interadministrativo para eludir
  licitación", con cadena de evidencia citada.

Mismo análisis, dos lecturas. La detección de corrupción *es* la inteligencia
competitiva.

## Lo que hace

- **Frentes y objetivos** — agrupas entidades (`contratante`) y contratistas
  (`contratista`) a vigilar. Un contratista se sigue en **todo el país**, no
  solo en tu frente.
- **Copiloto autónomo** — te habla primero (briefing), interrumpe cuando entra
  una bandera roja alta, y opera la consola por ti. Encuentra NITs por nombre —
  no necesitas saberlos.
- **`patternScan`** — la señal que ningún humano ve: concentración de
  adjudicaciones (índice **HHI**) y **representantes legales compartidos** entre
  "competidores". Solo emerge al cruzar fuentes.
- **Red de contratistas interactiva** — grafo de NITs y relaciones; hover = qué
  es, clic = detalle.
- **Entregables** — genera y descarga: **derecho de petición** (Ley 1755),
  **dossier** de evidencia citado, **hilo** para redes.
- **Barrido manual** — "Barrer ahora" corre el heartbeat al instante.
- **Cuenta poblada de fábrica** — cada registro arranca con hallazgos reales.

## Croma es el motor

Un proceso entra. Nueve endpoints lo interrogan. Sale un veredicto. **Sin Croma
no hay producto.**

| Endpoint | Aporta |
|---|---|
| `secop-processes-by-entity` | Barre los procesos nuevos de la entidad. |
| `secop-process-by-notice` | Adjudicatarios y cuantías del proceso. |
| `secop-contracts-by-provider` | Lo que un contratista ha ganado → concentración. |
| `secop-sanctions-by-provider` | Sanciones del proveedor en SECOP. |
| `rues-entity-by-nit` | ¿Existe? Constitución, estado, representantes. |
| `supersociedades-financial-statements` | ¿El capital cuadra con el contrato? |
| `rama-judicial-cases-by-entity` | Litigios por nombre de la empresa. |
| `procuraduria-disciplinary-records` | Antecedentes disciplinarios. |
| `contraloria-fiscal-records` | Responsabilidad fiscal. |

## Monorepo

Turborepo + pnpm workspaces.

| Ruta | Qué | Stack |
|---|---|---|
| `apps/web` | Dashboard + API + auth + copiloto | Next 16 · Elysia · Better Auth · Drizzle + Supabase Postgres · CopilotKit + Gemini · @xyflow/react · Streamdown |
| `apps/agent` | El agente vivo | Cloudflare Agents SDK · Durable Objects · Workflows · Queues |
| `packages/croma` | Cliente REST tipado de los 9 endpoints | rate-limit aware, envelope `data` |
| `packages/contracts` | Contratos compartidos (finding, croma, watch/budget) | web ↔ agente |

**Razonamiento:** Google Gemini — flash-lite para barrido y copiloto, pro para
scoring. **Datos gov:** Croma REST. **Memoria del agente:** SQLite en el Durable
Object; datos de app en Supabase Postgres.

## Setup

```bash
pnpm install

cp apps/web/.env.example apps/web/.env        # DATABASE_URL, BETTER_AUTH_SECRET, AGENT_INGEST_KEY, AGENT_URL, GEMINI_API_KEY, NEXT_PUBLIC_APP_URL
cp apps/agent/.dev.vars.example apps/agent/.dev.vars   # CROMA_API_KEY, GEMINI_API_KEY, AGENT_INGEST_KEY

pnpm -F @centinela/web db:migrate             # aplica el esquema (usa DIRECT_URL)
```

## Dev

```bash
pnpm dev                          # todo con turbo
pnpm -F @centinela/web dev        # dashboard :3000
pnpm -F @centinela/agent dev      # wrangler dev
pnpm test                         # vitest en todos los paquetes
```

## Deploy

- **Web** → Vercel (rootDirectory `apps/web`). Cada push a `main` auto-despliega.
- **Agente** → Cloudflare Worker: `pnpm -F @centinela/agent deploy`.

En producción: web en [centinela.aido.lat](https://centinela.aido.lat), agente
en `centinela-agent.aido-lat.workers.dev`. Sincronización automática: al cambiar
un frente, la web empuja los objetivos al agente.

## Arquitectura

El mapa de endpoints de Croma y el plan de construcción viven en
[`AGENTS.md`](./AGENTS.md). El material de pitch (`pitch-deck.html`) y el guion
de demo (`demo-guion.html`) están en la raíz.

## Licencia

[GNU AGPL-3.0-only](./LICENSE). Centinela corre como servicio de red, así que
aplica la cláusula de red: quien lo ofrezca por red debe poner el código a
disposición de sus usuarios.

<div align="center">

**PYMEs que ganan. Corrupción que se expone.** — todo cimentado en Croma.

</div>
