# Types & schemas

## 1. Zod is the single type source `MAJOR`

Define a zod schema for every data shape and derive the TypeScript type — never
hand-write a mirror type.

```ts
// core/project/domain/schemas.ts
export const projectSchema = z.object({ /* ... */ });
// core/project/domain/types.ts
export type Project = z.infer<typeof projectSchema>;
```

Row types come from Drizzle (`typeof projects.$inferSelect` → `ProjectRow`) and
are distinct from the wire type (`Project`, ISO-string timestamps). A `toProject`
mapper converts row → wire at the repository boundary.

**Check:** a new `type`/`interface` duplicating a schema's fields is a violation —
derive it with `z.infer<typeof schema>` or `(typeof CONST)[number]`.

## 2. Never re-export types `MAJOR`

**A type is imported from the one module that defines it — never re-exported from
a module that did not define it.** Do not add a convenience re-export to give a
type a second import path.

```ts
// ❌ BAD — client/hooks.ts re-exporting domain types so callers can
//         `import { Project } from "../hooks"`
export type { CreateProject, Project, UpdateProject };

// ✅ GOOD — every consumer imports from the defining module
import type { Project } from "@/core/project/domain/types";
```

**Why:** a re-export creates a second source of truth for the same type. It
invites drift, hides the real home, and reliably rots into dead code the moment
consumers (correctly) import from the origin instead. One type → one home → one
import path.

**Not a violation — a module's own public-API barrel.** `index.ts` files that
re-export the definitions of their *own sibling files* as the module's surface are
fine, because they re-export types the module itself defines, not types borrowed
from elsewhere:

- `server/common/responses/index.ts` (`export * from "./app-error"` …) — the
  responses module's public API.
- `server/drizzle/schemas/index.ts` (`export * from "./project-schema"` …) — the
  aggregate `schema` object Drizzle consumes.

The rule targets re-exporting a type you did **not** define (e.g. a hook file or an
unrelated barrel aliasing `domain/types`). Import such a type straight from its
`domain/types.ts`.

**Check:** flag any `export type { X }` / `export { type X }` re-export, or an
`export * from` that exists only to give a type defined in another module a shorter
import path. Point the consumer at the type's defining module instead.

## 3. Schemas are the validation boundary `MAJOR`

Elysia routes validate `body`/`query`/`params` with a zod schema in the
schema-options object — the same schema whose `z.infer` types the handler. No
unvalidated `body`. External input is zod-validated at the boundary.

**Check:** external input is validated with a domain zod schema at the route
boundary; the handler's argument type is the `z.infer` of that schema.
