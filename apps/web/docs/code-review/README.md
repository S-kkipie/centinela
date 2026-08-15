# Code review — conventions

Project-specific rules a reviewer (human or agent) enforces on `hackaton-starter`.
These are the invariants the reference `Project` domain follows; every new domain
cloned from it must follow them too.

- [types-schemas.md](./types-schemas.md) — zod as the single type source; **never re-export types**.
- [frontend-data-fetching.md](./frontend-data-fetching.md) — Eden proxy; **one factory hook per domain**.
- [tables-and-forms.md](./tables-and-forms.md) — **data-table toolkit** (useDataTable + RSC) & **TanStack Form** (useAppForm + Field).

## Architecture recap (where code goes)

Per domain under `src/core/<domain>/`:

| Layer | Holds |
|-------|-------|
| `domain/` | zod `schemas.ts` + inferred `types.ts`, `__tests__/` |
| `server/repository/` | Drizzle access (`import "server-only"` + shared `db`), ownership-scoped by `userId` |
| `server/services/` | orchestration, returns `AsyncAppResult<T>`, enforces ownership |
| `server/api/` | Elysia leaf `*.route.ts` + a domain `router.ts` (the prefix lives on the router) |
| `client/` | Eden/TanStack-Query hooks + UI |

Wire rules: every response is the `CommonResponse` envelope; expected 4xx are
`err(AppErrors.x)` values, never throws; authed routes carry both `.use(authed)`
and `authed: true`. A domain router isn't live until it's `.use()`d in
`src/server/router.ts`.
