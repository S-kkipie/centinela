# hackaton-starter — design

Date: 2026-07-11
Status: approved (brainstorming)

## Goal

A single Next 16 app that reproduces the `myworkin-b2c` backend/frontend
architecture **without Firebase** (Postgres-only) and without product-specific
integrations, so it can be cloned as a hackathon starter. It ships one CRUD
domain (`Project`) as the reference pattern to copy for new domains.

Source architecture: `myworkin/myworkin-client/apps/myworkin-b2c` +
`docs/code-review/*`.

## Scope decisions (locked)

- **Repo shape:** single Next app (no Turbo/pnpm workspace).
- **Auth:** Better Auth email+password, Drizzle adapter. CRUD rows are scoped to
  `userId`.
- **Auth UI:** `@better-auth-ui/react` (AuthCard) via a catch-all
  `app/auth/[path]/page.tsx`. Not hand-rolled.
- **Core model:** `Project`.
- **Frontend:** full CRUD UI (shadcn/ui + Tailwind v4).
- **Database:** Postgres provided only via `DATABASE_URL` env, wired through
  `config/env.ts` → `ServerConfig`. No docker-compose, no provider opinion.
- **Response envelope:** keep the generic Result-pattern envelope; **trim the
  AI-quota specifics** (`aiQuotaExceeded`, `AI_QUOTA_EXCEEDED`, the
  `detail {bucket,limit,plan}` shape).
- **git identity for the repo:** `user.email = issacysofia@gmail.com`,
  `user.name = S-kkipie`.

## Stack (kept from original)

| Layer | Choice |
|-------|--------|
| App | Next 16, React 19, TypeScript |
| API | Elysia under `/api/v1`, mounted at `app/api/v1/[...slugs]/route.ts` |
| Auth | Better Auth email+password, Drizzle adapter, `basePath /api/v1/auth` |
| DB | Drizzle + `node-postgres`, `DATABASE_URL` → `ServerConfig.databaseURL` |
| Client data | Eden treaty + `eden-tanstack-react-query` (`useElysia` proxy) |
| Types | zod domain schemas → `z.infer` (single type source) |
| Errors | Result pattern (`ok`/`err`/`AppResult`) + `CommonResponse` envelope + `errorToResponse` |
| Config | t3-env (`env.ts` → `ServerConfig`/`ClientConfig`) |
| Logging | LogTape `getLogger(["server", ...])` |
| UI | shadcn/ui + Tailwind v4 |
| Test/lint | Vitest + Biome (4-space indent) |

**Dropped from original:** firebase-admin, stripe, langchain/genai, apify,
cloudflare-stream, SES email, posthog, sentry, extension, live-events, google
OAuth. Env shrinks to three vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`NEXT_PUBLIC_APP_URL`. Email verification off (`requireEmailVerification: false`,
no send callbacks).

## Core model — `projects` table (Postgres / Drizzle)

```
projects
  id          text  pk, $defaultFn(crypto.randomUUID)
  user_id     text  -> user.id  onDelete: cascade      [index]
  name        text  notNull
  description text  nullable
  status      pgEnum project_status ('active','archived') default 'active'  [index]
  created_at  timestamp defaultNow notNull
  updated_at  timestamp defaultNow $onUpdate notNull
```

Row types via `$inferSelect` / `$inferInsert`. The wire shape is a zod
`projectSchema` whose timestamps are **ISO strings**; a `toProject(row)` mapper
converts `Date → ISO` at the repository boundary (same discipline the original
used for Firestore `toSelect*`, applied to Postgres here).

## CRUD triad — `src/core/project/`

```
domain/
  schemas.ts            projectSchema, createProjectSchema, updateProjectSchema, projectStatusSchema
  types.ts              Project, CreateProject, UpdateProject, ProjectStatus (z.infer)
  __tests__/schemas.test.ts
server/
  repository/
    create-project.ts         "server-only" + db insert
    find-projects-by-user.ts   list, newest-first, by userId
    find-project-by-id.ts      single row or null
    update-project.ts          update by (id, userId)
    delete-project.ts          delete by (id, userId)
    utils.ts                   toProject(row) Date->ISO mapper
  services/
    create-project-service.ts  -> AsyncAppResult<Project>
    list-projects-service.ts   -> AsyncAppResult<Project[]>
    get-project-service.ts     -> AsyncAppResult<Project>  (notFound if missing/foreign)
    update-project-service.ts  -> AsyncAppResult<Project>  (notFound if missing/foreign)
    delete-project-service.ts  -> AsyncAppResult<{ id }>
    __tests__/*
  api/
    router.ts                  new Elysia({ prefix: "/projects" }).use(...routes)
    routes/
      list-projects.route.ts    GET    /        authed
      create-project.route.ts   POST   /        authed  (201 created)
      get-project.route.ts      GET    /:id     authed
      update-project.route.ts   PUT    /:id     authed
      delete-project.route.ts   DELETE /:id     authed
client/
  hooks.ts              useProjects(), useProject(id), useCreateProject(), useUpdateProject(), useDeleteProject()
  ui/
    project-screen.tsx  list + create/edit dialog + delete
    project-form.tsx    create/edit form
    project-card.tsx    single item
```

Rules honored:
- Ownership enforced in the **service** layer: every read/update/delete filters
  by `userId`; a foreign or missing row returns `AppErrors.notFound()`.
- Routes carry both `.use(authed)` **and** `authed: true`; return via
  `CommonResponse.*` / `errorToResponse(...)` wrapped in `status(...)`; never
  `return data` directly.
- Each route declares a `response` schema map + `detail.tags/summary` (OpenAPI).
- Services return `AsyncAppResult`, never `throw` for expected 4xx.
- Client hooks bind the domain once (`const client = useElysia().projects`), use
  `queryOptions()/mutationOptions()`, read `data.response`, and use
  `useMutationWithRefreshEden` for server-rendered invalidation.

## Shared infra (copied / trimmed faithfully)

- `config/{env,server-config,client-config}.ts` — env limited to the 3 vars.
- `server/common/responses/{api,app-error,error-converter,result,status,index}.ts`
  — generic envelope over statuses `200/201/400/401/403/404/409/422/429/500`;
  AI-quota specifics removed.
- `server/common/timed.ts`.
- `server/drizzle/{db.ts, schemas/{auth-schema,project-schema,index}.ts}`.
- `server/auth/{auth.ts, middleware/authed.ts, require-auth.ts}` — `auth.ts` is a
  minimal `betterAuth({ emailAndPassword, drizzleAdapter, openAPI(dev) })` plus a
  React `cache()`-wrapped `authenticate()`; `require-auth.ts` is the page guard
  (`redirect` to `/auth/sign-in` when unauthenticated).
- `server/router.ts` — root Elysia `/api/v1`: mount betterAuth, CORS, openapi
  (dev-only), serverTiming, LogTape elysia logger, root `.onError`,
  `.use(projectRouter)`, `export default app` + `export type AppRouter`.
- `server/logger.ts` — LogTape `configure()` once (console sink), called from
  `instrumentation.ts`.
- `frontend/lib/{eden,eden-server,query-client,result,utils}.ts`.
- `frontend/hooks/use-mutation-refresh.ts`.
- `frontend/auth/auth.ts` — `authClient` via `createAuthClient` (better-auth/react).
- `frontend/providers/providers.tsx` — `QueryClientProvider` + `EdenProvider` +
  `@better-auth-ui/react` `AuthProvider` (wired to `authClient` + `next/navigation`)
  + `ThemeProvider` + `<Toaster/>`. No posthog/sentry.

## App routes (`src/app/`)

```
layout.tsx                   root: <Providers>, fonts, globals.css
page.tsx                     landing -> redirect (authed -> /projects, else -> /auth/sign-in)
(app)/layout.tsx             authed shell: require-auth guard + header + sign-out
(app)/projects/page.tsx      thin RSC: await params/guard -> <ProjectScreen/>
auth/[path]/page.tsx         @better-auth-ui AuthCard catch-all (sign-in / sign-up / etc.)
api/v1/[...slugs]/route.ts   export {GET,POST,PUT,PATCH,DELETE,OPTIONS} = app.fetch, maxDuration 60
```

## Tooling / root files

`package.json` (trimmed deps), `biome.json` (4-space), `tsconfig.json`
(`@/*`→`src/*`), `next.config.ts`, `drizzle.config.ts`, `vitest.config.ts`
(with `test.env` for `DATABASE_URL`/`BETTER_AUTH_SECRET`/`NEXT_PUBLIC_APP_URL`),
`postcss.config.mjs`, `src/app/globals.css` (Tailwind v4 + shadcn tokens, light
+ dark), `components.json`, `.env.example`, `.gitignore`, `README.md`,
`scripts/migrate.ts`, `instrumentation.ts`.

shadcn primitives generated/vendored: button, input, textarea, card, badge,
dialog, label, sonner (toast).

Dependencies (approx): `next`, `react`, `react-dom`, `elysia`,
`@elysiajs/{eden,cors,openapi,server-timing}`, `eden-tanstack-react-query`,
`@tanstack/react-query`, `better-auth`, `@better-auth/drizzle-adapter`,
`@better-auth-ui/react`, `@better-auth-ui/core`, `drizzle-orm`, `drizzle-zod`,
`pg`, `zod`, `@t3-oss/env-nextjs`, `@logtape/logtape`, `@logtape/elysia`,
`next-themes`, `sonner`, `lucide-react`, `class-variance-authority`, `clsx`,
`tailwind-merge`, `radix-ui`. Dev: `typescript`, `@types/*`, `drizzle-kit`,
`biome`, `vitest`, `tsx`, `tailwindcss`, `@tailwindcss/postcss`, `happy-dom`.

## Verification

`biome check .`, `vitest run`, `tsc --noEmit`, `next build`. Example tests:
`domain/schemas.test.ts` (zod parse/reject), a service test with a stubbed repo.

## Repo / delivery

1. Repo at `/home/skkippie/work/hackaton-starter`, `git init`,
   `user.email issacysofia@gmail.com` / `user.name S-kkipie`. (done for the spec commit)
2. Build the starter, run the verification pipeline.
3. **Confirm with the user before** `gh repo create hackaton-starter --private
   --source . --push` (outward-facing / irreversible).

## Non-goals

Billing, payments, AI, file storage, email delivery, OAuth providers,
multi-tenant orgs, the browser extension. Seams are left clean so any of these
can be added later following the same domain-triad pattern.
