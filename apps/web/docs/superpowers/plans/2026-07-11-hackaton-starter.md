# hackaton-starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single Next 16 app that reproduces the myworkin-b2c architecture (Elysia API + Better Auth + Drizzle/Postgres + Eden/TanStack Query + Result-pattern envelope), Firebase removed, with one `Project` CRUD domain as the clone-me reference.

**Architecture:** Domain code lives in `src/core/project/{domain,server,client}`. `domain/` holds zod schemas + inferred types; `server/` holds Drizzle repositories, `AsyncAppResult` services, and Elysia leaf routes composed into a domain router; `client/` holds Eden/TanStack-Query hooks and shadcn UI. A root Elysia app under `/api/v1` mounts Better Auth and every domain router, and is served by Next at `app/api/v1/[...slugs]/route.ts`. Errors are values (`ok`/`err`), never thrown for expected 4xx; every wire response is the `CommonResponse` envelope.

**Tech Stack:** Next 16, React 19, TypeScript, Elysia, Better Auth (+`@better-auth-ui/react`), Drizzle ORM + node-postgres, Eden + `eden-tanstack-react-query`, `@tanstack/react-query`, zod v4, `@t3-oss/env-nextjs`, LogTape, shadcn/ui + Tailwind v4, Vitest, Biome. Package manager: **pnpm**.

## Global Constraints

- Package manager is **pnpm**; every command uses `pnpm` / `pnpm exec` / `pnpm dlx`.
- Path alias: `@/*` → `src/*` (tsconfig + vitest).
- Env is exactly three vars: `DATABASE_URL` (url), `BETTER_AUTH_SECRET` (min 32 chars), `NEXT_PUBLIC_APP_URL` (url). Read them ONLY through `ServerConfig` / `ClientConfig` — never `process.env` in feature code (sole sanctioned raw reads: `NODE_ENV` inside `server-config.ts`, and `DATABASE_URL` inside `scripts/migrate.ts` + `drizzle.config.ts`).
- Better Auth `basePath` is `/api/v1/auth` on BOTH server (`auth.ts`) and client (`authClient`).
- Response envelope statuses are the closed set `200/201/400/401/403/404/409/422/429/500`. AI-quota specifics are intentionally absent.
- Naming to avoid a collision: the Drizzle row type is `ProjectRow`/`NewProjectRow`; the domain (wire) type is `Project` with ISO-string timestamps. A `toProject(row)` mapper converts `Date → ISO` at the repository boundary.
- Elysia auth routes need BOTH `.use(authed)` and `authed: true`, or the macro does not run.
- Services return `AsyncAppResult<T>` and never `throw` for expected 4xx; routes convert with `errorToResponse(...)` wrapped in `status(...)`.
- Biome: 4-space indent.
- Tests run under Vitest with `server-only` aliased to a no-op stub (below) so `import "server-only"` modules load in Node.

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `biome.json`, `next.config.ts`, `postcss.config.mjs`, `drizzle.config.ts`, `vitest.config.ts`, `components.json`, `.env.example`, `src/app/globals.css`, `src/frontend/lib/utils.ts`, `src/test/server-only-stub.ts`, `scripts/migrate.ts`
- Test: none (verification = install + typecheck)

**Interfaces:**
- Produces: the pnpm workspace, `cn()` util at `@/frontend/lib/utils`, path alias `@/*`, and the Vitest config every later test relies on.

- [ ] **Step 1: Write `package.json`**

```json
{
    "name": "hackaton-starter",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "check": "biome check .",
        "check:fix": "biome check --write .",
        "typecheck": "tsc --noEmit",
        "test": "vitest run",
        "db:generate": "drizzle-kit generate",
        "db:migrate": "tsx --env-file=.env scripts/migrate.ts",
        "db:studio": "drizzle-kit studio"
    },
    "dependencies": {
        "@better-auth-ui/core": "^1.6.8",
        "@better-auth-ui/react": "^1.6.8",
        "@better-auth/drizzle-adapter": "^1.6.18",
        "@elysiajs/cors": "^1.4.2",
        "@elysiajs/eden": "^1.4.9",
        "@elysiajs/openapi": "^1.4.15",
        "@elysiajs/server-timing": "^1.4.1",
        "@logtape/elysia": "^2.2.1",
        "@logtape/logtape": "^2.2.1",
        "@t3-oss/env-nextjs": "^0.13.11",
        "@tanstack/react-query": "^5.100.13",
        "better-auth": "^1.6.18",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "drizzle-orm": "^0.45.2",
        "drizzle-zod": "^0.8.3",
        "eden-tanstack-react-query": "^0.1.10",
        "elysia": "^1.4.28",
        "next": "16.2.6",
        "next-themes": "^0.4.6",
        "pg": "^8.21.0",
        "react": "19.2.4",
        "react-dom": "19.2.4",
        "sonner": "^2.0.7",
        "tailwind-merge": "^3.6.0",
        "zod": "^4.4.3"
    },
    "devDependencies": {
        "@biomejs/biome": "^2.3.0",
        "@tailwindcss/postcss": "^4",
        "@types/node": "^20",
        "@types/pg": "^8.20.0",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "drizzle-kit": "^0.31.10",
        "happy-dom": "^15.11.6",
        "tailwindcss": "^4",
        "tsx": "^4.20.0",
        "tw-animate-css": "^1.4.0",
        "typescript": "^5",
        "vitest": "^3.2.4"
    }
}
```

> Note: `lucide-react` and `radix-ui` are intentionally omitted — `pnpm dlx shadcn add` (Task 12) installs whatever icon/primitive versions its components need.

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["dom", "dom.iterable", "ES2022"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [{ "name": "next" }],
        "paths": { "@/*": ["./src/*"] }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `biome.json`**

```json
{
    "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
    "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
    "files": { "ignoreUnknown": true },
    "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 4 },
    "linter": {
        "enabled": true,
        "rules": {
            "recommended": true,
            "suspicious": { "noArrayIndexKey": "off" },
            "correctness": { "noUnknownAtRules": "off" }
        }
    },
    "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
```

- [ ] **Step 4: Write `next.config.ts`, `postcss.config.mjs`, `drizzle.config.ts`**

`next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["pg"],
};

export default nextConfig;
```

`postcss.config.mjs`:
```js
const config = {
    plugins: ["@tailwindcss/postcss"],
};

export default config;
```

`drizzle.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/server/drizzle/schemas/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    casing: "snake_case",
    dbCredentials: {
        // biome-ignore lint/style/noNonNullAssertion: drizzle-kit CLI reads the raw env
        url: process.env.DATABASE_URL!,
    },
});
```

- [ ] **Step 5: Write `vitest.config.ts` and the `server-only` stub**

`src/test/server-only-stub.ts`:
```ts
// Vitest runs in Node without the "react-server" export condition, so the real
// `server-only` package throws on import. Aliased to this no-op so repository /
// service modules that do `import "server-only"` can be unit-tested.
export {};
```

`vitest.config.ts`:
```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            "server-only": r("./src/test/server-only-stub.ts"),
            "@": r("./src"),
        },
    },
    test: {
        environment: "node",
        globals: true,
        env: {
            DATABASE_URL: "postgres://user:pass@localhost:5432/app",
            BETTER_AUTH_SECRET: "test-secret-least-thirty-two-chars-long",
            NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        },
    },
});
```

- [ ] **Step 6: Write `components.json`, `src/frontend/lib/utils.ts`, `src/app/globals.css`**

`components.json`:
```json
{
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": true,
    "tsx": true,
    "tailwind": {
        "config": "",
        "css": "src/app/globals.css",
        "baseColor": "neutral",
        "cssVariables": true,
        "prefix": ""
    },
    "aliases": {
        "components": "@/frontend/components",
        "utils": "@/frontend/lib/utils",
        "ui": "@/frontend/components/ui",
        "lib": "@/frontend/lib",
        "hooks": "@/frontend/hooks"
    },
    "iconLibrary": "lucide"
}
```

`src/frontend/lib/utils.ts`:
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

`src/app/globals.css` (shadcn new-york / neutral, Tailwind v4):
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
    --radius: 0.625rem;
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);
}

.dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
}

@theme inline {
    --radius-sm: calc(var(--radius) - 4px);
    --radius-md: calc(var(--radius) - 2px);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) + 4px);
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
}

@layer base {
    * {
        @apply border-border outline-ring/50;
    }
    body {
        @apply bg-background text-foreground;
    }
}
```

- [ ] **Step 7: Write `scripts/migrate.ts` and `.env.example`**

`scripts/migrate.ts`:
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();

// biome-ignore lint/suspicious/noConsole: standalone migration script
console.log("migrations applied");
```

`.env.example`:
```bash
# Postgres connection string (Supabase, Neon, local, whatever)
DATABASE_URL="postgres://user:password@host:5432/dbname"

# Better Auth secret — generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="change-me-min-32-chars-xxxxxxxxxxxxxxxxxx"

# Public app URL (used by Better Auth + Eden client base URL)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 8: Install and verify**

Run: `pnpm install`
Expected: dependencies resolve, `node_modules` created.

Run: `pnpm exec biome check .`
Expected: PASS (or only formatting notices on JSON — run `pnpm run check:fix` if so, then re-check).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next app, tooling, tailwind, drizzle/vitest config"
```

---

### Task 2: Config layer (env + ServerConfig/ClientConfig)

**Files:**
- Create: `src/config/env.ts`, `src/config/server-config.ts`, `src/config/client-config.ts`
- Test: none (typecheck only)

**Interfaces:**
- Produces:
  - `ServerConfig.databaseURL: string`, `ServerConfig.baseUrl: string`, `ServerConfig.betterAuthSecret: string`, `ServerConfig.info: {name,version,description}`, `ServerConfig.isProduction: boolean`, `ServerConfig.isDevelopment: boolean`
  - `ClientConfig.baseUrl: string`

- [ ] **Step 1: Write `src/config/env.ts`**

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        DATABASE_URL: z.url(),
        BETTER_AUTH_SECRET: z.string().min(32),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.url(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    emptyStringAsUndefined: true,
});
```

- [ ] **Step 2: Write `src/config/server-config.ts`**

```ts
import { env } from "@/config/env";

export const ServerConfig = {
    databaseURL: env.DATABASE_URL,
    baseUrl: env.NEXT_PUBLIC_APP_URL,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    info: {
        name: "Hackaton Starter API",
        version: "1.0.0",
        description: "Hackaton Starter API",
    },
    /** Single sanctioned read of the Node built-in. */
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
} as const;
```

- [ ] **Step 3: Write `src/config/client-config.ts`**

```ts
import { env } from "./env";

export const ClientConfig = {
    baseUrl: env.NEXT_PUBLIC_APP_URL,
} as const;
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

```bash
git add -A
git commit -m "feat: env validation + ServerConfig/ClientConfig"
```

---

### Task 3: Response envelope (Result pattern)

**Files:**
- Create: `src/server/common/responses/{status,result,app-error,api,error-converter,index}.ts`
- Test: `src/server/common/responses/__tests__/result.test.ts`, `src/server/common/responses/__tests__/error-converter.test.ts`

**Interfaces:**
- Produces:
  - `ok<T>(data): Ok<T>`, `err<E>(error): Err<E>`, `isOk`, `isErr`, `matchResult`, types `Result<T,E>`, `Ok<T>`, `Err<E>`
  - `AppError` union, `AppErrors` factory (`invalidBody/invalidId/invalidQuery/unauthorized/forbidden/notFound/conflict/tooManyRequests/unprocessableEntity/unexpected`), `AppResult<T>`, `AsyncAppResult<T>`
  - `CommonResponse.*`, `successResponseSchema`, `createdResponseSchema`, `errorResponseSchema`, `APIResponse<D>`
  - `errorToResponse(error): APIErrorResponse`
  - `STATUS_MAP`

- [ ] **Step 1: Write `status.ts` and `result.ts`**

`src/server/common/responses/status.ts`:
```ts
export const STATUS_MAP = {
    200: "OK",
    201: "CREATED",
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
} as const;

export type ApiStatus = keyof typeof STATUS_MAP;
export type ApiErrorStatus = Exclude<ApiStatus, 200 | 201>;
export type ApiStatusText = (typeof STATUS_MAP)[ApiStatus];
```

`src/server/common/responses/result.ts`:
```ts
export type Ok<T> = { ok: true; data: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> =>
    !result.ok;

export const matchResult = <T, E, R>(
    result: Result<T, E>,
    handlers: { ok: (data: T) => R; err: (error: E) => R },
): R => (result.ok ? handlers.ok(result.data) : handlers.err(result.error));
```

- [ ] **Step 2: Write `app-error.ts` (AI-quota trimmed)**

`src/server/common/responses/app-error.ts`:
```ts
import type { Result } from "./result";

export type AppError =
    | {
          type: "ValidationError";
          code: "INVALID_BODY" | "INVALID_ID" | "INVALID_QUERY";
          status: 400;
          targets?: string[];
          cause?: unknown;
      }
    | { type: "UnauthorizedError"; code: "UNAUTHORIZED"; status: 401; cause?: unknown }
    | { type: "ForbiddenError"; code: "FORBIDDEN"; status: 403; cause?: unknown }
    | {
          type: "NotFoundError";
          code: "NOT_FOUND";
          status: 404;
          targets?: string[];
          cause?: unknown;
      }
    | {
          type: "ConflictError";
          code: "CONFLICT";
          status: 409;
          targets?: string[];
          cause?: unknown;
      }
    | { type: "TooManyRequestsError"; code: "TOO_MANY_REQUESTS"; status: 429; cause?: unknown }
    | {
          type: "UnprocessableEntityError";
          code: "UNPROCESSABLE_ENTITY";
          status: 422;
          targets?: string[];
          cause?: unknown;
      }
    | { type: "UnexpectedError"; code: "INTERNAL_SERVER_ERROR"; status: 500; cause: unknown };

export type AppResult<T> = Result<T, AppError>;
export type AsyncAppResult<T> = Promise<AppResult<T>>;

export const AppErrors = {
    invalidBody(params?: { code?: "INVALID_BODY"; targets?: string[]; cause?: unknown }): AppError {
        return { type: "ValidationError", code: params?.code ?? "INVALID_BODY", status: 400, targets: params?.targets, cause: params?.cause };
    },
    invalidId(params?: { targets?: string[]; cause?: unknown }): AppError {
        return { type: "ValidationError", code: "INVALID_ID", status: 400, targets: params?.targets, cause: params?.cause };
    },
    invalidQuery(params?: { targets?: string[]; cause?: unknown }): AppError {
        return { type: "ValidationError", code: "INVALID_QUERY", status: 400, targets: params?.targets, cause: params?.cause };
    },
    unauthorized(cause?: unknown): AppError {
        return { type: "UnauthorizedError", code: "UNAUTHORIZED", status: 401, cause };
    },
    forbidden(cause?: unknown): AppError {
        return { type: "ForbiddenError", code: "FORBIDDEN", status: 403, cause };
    },
    notFound(params?: { targets?: string[]; cause?: unknown }): AppError {
        return { type: "NotFoundError", code: "NOT_FOUND", status: 404, targets: params?.targets, cause: params?.cause };
    },
    conflict(params?: { targets?: string[]; cause?: unknown }): AppError {
        return { type: "ConflictError", code: "CONFLICT", status: 409, targets: params?.targets, cause: params?.cause };
    },
    tooManyRequests(params?: { cause?: unknown }): AppError {
        return { type: "TooManyRequestsError", code: "TOO_MANY_REQUESTS", status: 429, cause: params?.cause };
    },
    unprocessableEntity(params?: { targets?: string[]; cause?: unknown }): AppError {
        return { type: "UnprocessableEntityError", code: "UNPROCESSABLE_ENTITY", status: 422, targets: params?.targets, cause: params?.cause };
    },
    unexpected(cause: unknown): AppError {
        return { type: "UnexpectedError", code: "INTERNAL_SERVER_ERROR", status: 500, cause };
    },
} as const;
```

- [ ] **Step 3: Write `api.ts` (AI-quota trimmed)**

`src/server/common/responses/api.ts`:
```ts
import { z } from "zod";
import type { ApiErrorStatus, ApiStatus } from "./status";
import { STATUS_MAP } from "./status";

export type APIResponse<D = undefined> = {
    response?: D;
    targets?: string[];
    code: string;
    status: ApiStatus;
};

export type APISuccessResponse<D = undefined, C extends string = "OK", S extends number = 200> = {
    response: D;
    code: C;
    status: S;
};

export type APIErrorResponse<C extends string = string> = {
    code: C;
    status: ApiErrorStatus;
    targets?: string[];
};

type SuccessfulParams<T, C extends string = "OK"> = { response?: T; code?: C };

export const errorResponseSchema = (status: ApiErrorStatus = 500) =>
    z
        .object({
            code: z.string().describe(`example: ${STATUS_MAP[status]}`),
            status: z.literal(status).describe(`example: ${status}`),
            targets: z.array(z.string()).optional().describe('example: ["name"]'),
        })
        .describe("ErrorResponse");

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T, modelName: string) =>
    z
        .object({ response: dataSchema, code: z.literal("OK"), status: z.literal(200) })
        .describe(`${modelName}SuccessResponse`);

export const createdResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T, modelName: string) =>
    z
        .object({ response: dataSchema, code: z.literal("CREATED"), status: z.literal(201) })
        .describe(`${modelName}CreatedResponse`);

export const CommonResponse = {
    successful<T = undefined, C extends string = "OK">(params?: SuccessfulParams<T, C>): APISuccessResponse<T, C, 200> {
        return { response: params?.response as T, code: (params?.code ?? "OK") as C, status: 200 };
    },
    created<T = undefined, C extends string = "CREATED">(params?: SuccessfulParams<T, C>): APISuccessResponse<T, C, 201> {
        return { response: params?.response as T, code: (params?.code ?? "CREATED") as C, status: 201 };
    },
    unauthorized(): APIErrorResponse<"UNAUTHORIZED"> {
        return { code: "UNAUTHORIZED", status: 401 };
    },
    forbidden({ code = "FORBIDDEN" }: { code?: string } = {}): APIResponse {
        return { code, status: 403 };
    },
    notFound({ code = "NOT_FOUND", targets }: { code?: string; targets?: string[] } = {}): APIResponse {
        return { code, status: 404, targets };
    },
    conflict({ code = "CONFLICT", targets }: { code?: string; targets?: string[] } = {}): APIResponse {
        return { code, status: 409, targets };
    },
    internalServerError({ code = "INTERNAL_SERVER_ERROR" }: { code?: string } = {}): APIResponse {
        return { code, status: 500 };
    },
} as const;
```

- [ ] **Step 4: Write `error-converter.ts` and `index.ts`**

`src/server/common/responses/error-converter.ts`:
```ts
import { getLogger } from "@logtape/logtape";
import type { APIErrorResponse } from "./api";
import type { AppError } from "./app-error";

const errorLogger = getLogger(["server", "error"]);

const normalizeWhitespace = (value: string): string => value.replaceAll(/\s+/g, " ").trim();

const formatErrorCause = (cause: unknown): string => {
    if (cause == null) return "Unknown error";
    if (cause instanceof Error) {
        const message = normalizeWhitespace(cause.message);
        return message ? `${cause.name}: ${message}` : cause.name;
    }
    if (typeof cause === "string") return normalizeWhitespace(cause);
    try {
        return normalizeWhitespace(JSON.stringify(cause));
    } catch {
        return String(cause);
    }
};

export const errorToResponse = (error: AppError): APIErrorResponse => {
    // 5xx: surface the real cause to the server log (wire response hides it).
    // 4xx are expected control flow and stay quiet.
    if (error.status >= 500) {
        const cause = "cause" in error ? error.cause : undefined;
        errorLogger.error("Server error {code}: {cause}", { code: error.code, cause: formatErrorCause(cause) });
    }
    return {
        code: error.code,
        status: error.status,
        targets: "targets" in error ? error.targets : undefined,
    };
};
```

`src/server/common/responses/index.ts`:
```ts
export * from "./api";
export * from "./app-error";
export * from "./error-converter";
export * from "./result";
export * from "./status";
```

- [ ] **Step 5: Write the failing tests**

`src/server/common/responses/__tests__/result.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { err, isErr, isOk, matchResult, ok } from "../result";

describe("Result", () => {
    it("ok() wraps data and narrows via isOk", () => {
        const r = ok(42);
        expect(isOk(r)).toBe(true);
        expect(isErr(r)).toBe(false);
        if (isOk(r)) expect(r.data).toBe(42);
    });

    it("err() wraps error and narrows via isErr", () => {
        const r = err("boom");
        expect(isErr(r)).toBe(true);
        if (isErr(r)) expect(r.error).toBe("boom");
    });

    it("matchResult dispatches on variant", () => {
        expect(matchResult(ok(2), { ok: (d) => d * 2, err: () => -1 })).toBe(4);
        expect(matchResult(err("x"), { ok: () => -1, err: (e) => e.length })).toBe(1);
    });
});
```

`src/server/common/responses/__tests__/error-converter.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { AppErrors } from "../app-error";
import { errorToResponse } from "../error-converter";

describe("errorToResponse", () => {
    it("maps a 404 to the wire shape with targets, no cause leak", () => {
        const wire = errorToResponse(AppErrors.notFound({ targets: ["id"] }));
        expect(wire).toEqual({ code: "NOT_FOUND", status: 404, targets: ["id"] });
    });

    it("maps a 500 without exposing the cause on the wire", () => {
        const wire = errorToResponse(AppErrors.unexpected(new Error("db down")));
        expect(wire.code).toBe("INTERNAL_SERVER_ERROR");
        expect(wire.status).toBe(500);
        expect("cause" in wire).toBe(false);
    });
});
```

- [ ] **Step 6: Run tests**

Run: `pnpm exec vitest run src/server/common/responses`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Result-pattern response envelope (AI-quota trimmed)"
```

---

### Task 4: Drizzle schema + db handle

**Files:**
- Create: `src/server/drizzle/schemas/auth-schema.ts`, `src/server/drizzle/schemas/project-schema.ts`, `src/server/drizzle/schemas/index.ts`, `src/server/drizzle/db.ts`
- Test: none (verified by `drizzle-kit generate` producing SQL + typecheck)

**Interfaces:**
- Produces:
  - Drizzle tables `user`, `session`, `account`, `verification`, `projects` + `projectStatus` enum
  - Types `ProjectRow = typeof projects.$inferSelect`, `NewProjectRow = typeof projects.$inferInsert`
  - `db` (shared node-postgres Drizzle handle, `casing: "snake_case"`)

- [ ] **Step 1: Write `auth-schema.ts` (Better Auth core tables)**

```ts
import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    },
    (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);
```

- [ ] **Step 2: Write `project-schema.ts` (the core model)**

```ts
import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const projectStatus = pgEnum("project_status", ["active", "archived"]);

/**
 * The starter's reference CRUD model. Owned by a user; deletion cascades so a
 * user's projects vanish with them. Clone this file's shape for a new domain.
 */
export const projects = pgTable(
    "projects",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        description: text("description"),
        status: projectStatus("status").default("active").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    },
    (table) => [
        index("projects_user_id_idx").on(table.userId),
        index("projects_status_idx").on(table.status),
        check("projects_name_not_empty", sql`length(trim(${table.name})) > 0`),
    ],
);

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
```

- [ ] **Step 3: Write `schemas/index.ts` and `db.ts`**

`src/server/drizzle/schemas/index.ts`:
```ts
export * from "./auth-schema";
export * from "./project-schema";
```

`src/server/drizzle/db.ts`:
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { ServerConfig } from "@/config/server-config";
import * as schema from "@/server/drizzle/schemas";

export const db = drizzle({
    connection: {
        connectionString: ServerConfig.databaseURL,
        ssl: { rejectUnauthorized: false },
    },
    schema,
    casing: "snake_case",
});
```

- [ ] **Step 4: Generate the migration + verify**

Run: `pnpm exec drizzle-kit generate`
Expected: creates `drizzle/0000_*.sql` containing `CREATE TABLE "user"`, `"session"`, `"account"`, `"verification"`, `"projects"`, and `CREATE TYPE "project_status"`. (No DB connection needed for `generate`.)

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: drizzle auth + projects schema, shared db handle, initial migration"
```

---

### Task 5: Better Auth (server + client)

**Files:**
- Create: `src/server/auth/auth.ts`, `src/server/auth/middleware/authed.ts`, `src/server/auth/require-auth.ts`, `src/frontend/auth/auth.ts`
- Test: none (typecheck; auth exercised end-to-end in Task 14)

**Interfaces:**
- Produces:
  - `auth` (Better Auth instance, `basePath /api/v1/auth`), `authenticate()` → `{ user, session } | null`
  - `authed` (Elysia macro; with `authed: true` injects `user`/`session`, else 401)
  - `requireAuth()` → `{ user, session }` (redirects to `/auth/sign-in` when unauthenticated)
  - `authClient` (better-auth react client)

- [ ] **Step 1: Write `src/server/auth/auth.ts`**

```ts
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getLogger } from "@logtape/logtape";
import { APIError, betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { ServerConfig } from "@/config/server-config";
import { db } from "@/server/drizzle/db";
import * as authSchema from "@/server/drizzle/schemas/auth-schema";

const logger = getLogger(["server", "auth"]);

export const auth = betterAuth({
    baseURL: ServerConfig.baseUrl,
    basePath: "/api/v1/auth",
    secret: ServerConfig.betterAuthSecret,
    session: { freshAge: 0 },
    emailAndPassword: {
        enabled: true,
        // Starter keeps verification off so sign-up works with no email provider.
        requireEmailVerification: false,
    },
    plugins: [openAPI({ disableDefaultReference: !ServerConfig.isDevelopment })],
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
});

/**
 * React cache()-wrapped session read for server components / guards.
 * Swallows errors → null so callers can treat it as a null-tolerant read.
 */
export const authenticate = cache(async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        return session ? { user: session.user, session: session.session } : null;
    } catch (e) {
        if (e instanceof APIError) {
            logger.warn("Auth API error: {error}", { error: e });
            return null;
        }
        logger.error("Authentication error: {error}", { error: e });
        return null;
    }
});
```

- [ ] **Step 2: Write `src/server/auth/middleware/authed.ts`**

```ts
import { Elysia } from "elysia";
import { auth } from "@/server/auth/auth";
import { CommonResponse } from "@/server/common/responses";

/**
 * Resolves the Better Auth session. On a route that sets `authed: true`, injects
 * `user`/`session`; returns a structured 401 when there is no session.
 */
export const authed = new Elysia({ name: "authed" }).macro({
    authed: {
        async resolve({ status, request: { headers } }) {
            const session = await auth.api.getSession({ headers });
            if (!session) return status(401, CommonResponse.unauthorized());
            return { user: session.user, session: session.session };
        },
    },
});
```

- [ ] **Step 3: Write `src/server/auth/require-auth.ts`**

```ts
import "server-only";
import { redirect } from "next/navigation";
import { authenticate } from "./auth";

/** Page guard for protected server components. `redirect` throws, so the
 *  return is always a non-null session. */
export async function requireAuth() {
    const session = await authenticate();
    if (!session) redirect("/auth/sign-in");
    return session;
}
```

- [ ] **Step 4: Write `src/frontend/auth/auth.ts`**

```ts
import { createAuthClient } from "better-auth/react";
import { ClientConfig } from "@/config/client-config";

export const authClient = createAuthClient({
    baseURL: ClientConfig.baseUrl,
    basePath: "/api/v1/auth",
});
```

- [ ] **Step 5: Verify + commit**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

```bash
git add -A
git commit -m "feat: Better Auth server instance, authed macro, page guard, client"
```

---

### Task 6: Project domain (schemas + types)

**Files:**
- Create: `src/core/project/domain/schemas.ts`, `src/core/project/domain/types.ts`
- Test: `src/core/project/domain/__tests__/schemas.test.ts`

**Interfaces:**
- Produces:
  - `projectStatusSchema`, `projectSchema`, `createProjectSchema`, `updateProjectSchema`
  - types `Project`, `CreateProject`, `UpdateProject`, `ProjectStatus`

- [ ] **Step 1: Write the failing test**

`src/core/project/domain/__tests__/schemas.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createProjectSchema, projectSchema, updateProjectSchema } from "../schemas";

describe("createProjectSchema", () => {
    it("accepts a name and optional fields", () => {
        const parsed = createProjectSchema.parse({ name: "Launch" });
        expect(parsed.name).toBe("Launch");
    });

    it("rejects an empty name", () => {
        expect(createProjectSchema.safeParse({ name: "" }).success).toBe(false);
    });

    it("rejects an unknown status", () => {
        expect(createProjectSchema.safeParse({ name: "x", status: "nope" }).success).toBe(false);
    });
});

describe("updateProjectSchema", () => {
    it("allows a partial update", () => {
        expect(updateProjectSchema.safeParse({ status: "archived" }).success).toBe(true);
    });

    it("allows description to be nulled", () => {
        expect(updateProjectSchema.safeParse({ description: null }).success).toBe(true);
    });
});

describe("projectSchema", () => {
    it("requires ISO string timestamps", () => {
        const ok = projectSchema.safeParse({
            id: "p1",
            userId: "u1",
            name: "A",
            description: null,
            status: "active",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
        });
        expect(ok.success).toBe(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/core/project/domain`
Expected: FAIL — cannot resolve `../schemas`.

- [ ] **Step 3: Write `schemas.ts`**

```ts
import { z } from "zod";

export const projectStatusSchema = z.enum(["active", "archived"]);

/** Wire shape: timestamps are ISO strings (mapped from Date at the repo boundary). */
export const projectSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string().min(1),
    description: z.string().nullable(),
    status: projectStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createProjectSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: projectStatusSchema.optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: projectStatusSchema.optional(),
});
```

- [ ] **Step 4: Write `types.ts`**

```ts
import type { z } from "zod";
import type {
    createProjectSchema,
    projectSchema,
    projectStatusSchema,
    updateProjectSchema,
} from "./schemas";

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/core/project/domain`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: project domain schemas + inferred types"
```

---

### Task 7: Project repository (Drizzle CRUD)

**Files:**
- Create: `src/core/project/server/repository/create-project.ts`, `find-projects-by-user.ts`, `find-project-by-id.ts`, `update-project.ts`, `delete-project.ts`, `utils.ts`
- Test: none (DB-touching; typecheck here, behavior covered via mocked services in Task 8 and end-to-end in Task 14)

**Interfaces:**
- Consumes: `db`, `projects`, `ProjectRow` (Task 4); `Project`, `CreateProject`, `UpdateProject`, `ProjectStatus` (Task 6)
- Produces:
  - `createProject(values: { userId: string; name: string; description?: string | null; status?: ProjectStatus }): Promise<ProjectRow>`
  - `findProjectsByUser(userId: string): Promise<ProjectRow[]>`
  - `findProjectById(id: string, userId: string): Promise<ProjectRow | null>`
  - `updateProject(id: string, userId: string, values: UpdateProject): Promise<ProjectRow | null>`
  - `deleteProject(id: string, userId: string): Promise<{ id: string } | null>`
  - `toProject(row: ProjectRow): Project`

- [ ] **Step 1: Write `utils.ts` (row → wire mapper)**

```ts
import type { Project } from "@/core/project/domain/types";
import type { ProjectRow } from "@/server/drizzle/schemas/project-schema";

/** Convert a DB row (Date timestamps) into the wire shape (ISO strings). */
export function toProject(row: ProjectRow): Project {
    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
```

- [ ] **Step 2: Write `create-project.ts` and `find-projects-by-user.ts`**

`create-project.ts`:
```ts
import "server-only";
import type { ProjectStatus } from "@/core/project/domain/types";
import { db } from "@/server/drizzle/db";
import { type ProjectRow, projects } from "@/server/drizzle/schemas/project-schema";

export async function createProject(values: {
    userId: string;
    name: string;
    description?: string | null;
    status?: ProjectStatus;
}): Promise<ProjectRow> {
    const [row] = await db.insert(projects).values(values).returning();
    return row;
}
```

`find-projects-by-user.ts`:
```ts
import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { type ProjectRow, projects } from "@/server/drizzle/schemas/project-schema";

export async function findProjectsByUser(userId: string): Promise<ProjectRow[]> {
    return db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.createdAt));
}
```

- [ ] **Step 3: Write `find-project-by-id.ts`, `update-project.ts`, `delete-project.ts`**

`find-project-by-id.ts`:
```ts
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { type ProjectRow, projects } from "@/server/drizzle/schemas/project-schema";

export async function findProjectById(id: string, userId: string): Promise<ProjectRow | null> {
    const [row] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .limit(1);
    return row ?? null;
}
```

`update-project.ts`:
```ts
import "server-only";
import { and, eq } from "drizzle-orm";
import type { UpdateProject } from "@/core/project/domain/types";
import { db } from "@/server/drizzle/db";
import { type ProjectRow, projects } from "@/server/drizzle/schemas/project-schema";
import { findProjectById } from "./find-project-by-id";

export async function updateProject(
    id: string,
    userId: string,
    values: UpdateProject,
): Promise<ProjectRow | null> {
    // Empty patch → no SET clause allowed; just return the current row (or null).
    if (Object.keys(values).length === 0) return findProjectById(id, userId);

    const [row] = await db
        .update(projects)
        .set(values)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();
    return row ?? null;
}
```

`delete-project.ts`:
```ts
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { projects } from "@/server/drizzle/schemas/project-schema";

export async function deleteProject(id: string, userId: string): Promise<{ id: string } | null> {
    const [row] = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning({ id: projects.id });
    return row ?? null;
}
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

```bash
git add -A
git commit -m "feat: project drizzle repository + row->wire mapper"
```

---

### Task 8: Project services (AsyncAppResult + ownership)

**Files:**
- Create: `src/core/project/server/services/create-project-service.ts`, `list-projects-service.ts`, `get-project-service.ts`, `update-project-service.ts`, `delete-project-service.ts`
- Test: `src/core/project/server/services/__tests__/project-services.test.ts`

**Interfaces:**
- Consumes: repository functions + `toProject` (Task 7); `AppErrors`, `ok`, `err`, `AsyncAppResult` (Task 3); domain types (Task 6)
- Produces:
  - `createProjectService(userId: string, input: CreateProject): AsyncAppResult<Project>`
  - `listProjectsService(userId: string): AsyncAppResult<Project[]>`
  - `getProjectService(userId: string, id: string): AsyncAppResult<Project>`
  - `updateProjectService(userId: string, id: string, input: UpdateProject): AsyncAppResult<Project>`
  - `deleteProjectService(userId: string, id: string): AsyncAppResult<{ id: string }>`

- [ ] **Step 1: Write the five service files**

`create-project-service.ts`:
```ts
import "server-only";
import type { CreateProject, Project } from "@/core/project/domain/types";
import { type AsyncAppResult, AppErrors, err, ok } from "@/server/common/responses";
import { createProject } from "../repository/create-project";
import { toProject } from "../repository/utils";

export async function createProjectService(userId: string, input: CreateProject): AsyncAppResult<Project> {
    try {
        const row = await createProject({ userId, ...input });
        return ok(toProject(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
```

`list-projects-service.ts`:
```ts
import "server-only";
import type { Project } from "@/core/project/domain/types";
import { type AsyncAppResult, AppErrors, err, ok } from "@/server/common/responses";
import { findProjectsByUser } from "../repository/find-projects-by-user";
import { toProject } from "../repository/utils";

export async function listProjectsService(userId: string): AsyncAppResult<Project[]> {
    try {
        const rows = await findProjectsByUser(userId);
        return ok(rows.map(toProject));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
```

`get-project-service.ts`:
```ts
import "server-only";
import type { Project } from "@/core/project/domain/types";
import { type AsyncAppResult, AppErrors, err, ok } from "@/server/common/responses";
import { findProjectById } from "../repository/find-project-by-id";
import { toProject } from "../repository/utils";

export async function getProjectService(userId: string, id: string): AsyncAppResult<Project> {
    try {
        const row = await findProjectById(id, userId);
        if (!row) return err(AppErrors.notFound({ targets: ["id"] }));
        return ok(toProject(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
```

`update-project-service.ts`:
```ts
import "server-only";
import type { Project, UpdateProject } from "@/core/project/domain/types";
import { type AsyncAppResult, AppErrors, err, ok } from "@/server/common/responses";
import { updateProject } from "../repository/update-project";
import { toProject } from "../repository/utils";

export async function updateProjectService(
    userId: string,
    id: string,
    input: UpdateProject,
): AsyncAppResult<Project> {
    try {
        const row = await updateProject(id, userId, input);
        if (!row) return err(AppErrors.notFound({ targets: ["id"] }));
        return ok(toProject(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
```

`delete-project-service.ts`:
```ts
import "server-only";
import { type AsyncAppResult, AppErrors, err, ok } from "@/server/common/responses";
import { deleteProject } from "../repository/delete-project";

export async function deleteProjectService(userId: string, id: string): AsyncAppResult<{ id: string }> {
    try {
        const row = await deleteProject(id, userId);
        if (!row) return err(AppErrors.notFound({ targets: ["id"] }));
        return ok(row);
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
```

- [ ] **Step 2: Write the failing test (mock the repository modules)**

`src/core/project/server/services/__tests__/project-services.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repository/find-project-by-id", () => ({ findProjectById: vi.fn() }));
vi.mock("../../repository/create-project", () => ({ createProject: vi.fn() }));
vi.mock("../../repository/delete-project", () => ({ deleteProject: vi.fn() }));

import { createProject } from "../../repository/create-project";
import { deleteProject } from "../../repository/delete-project";
import { findProjectById } from "../../repository/find-project-by-id";
import { createProjectService } from "../create-project-service";
import { deleteProjectService } from "../delete-project-service";
import { getProjectService } from "../get-project-service";

const row = {
    id: "p1",
    userId: "u1",
    name: "Alpha",
    description: null,
    status: "active" as const,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("getProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when the row is missing or foreign", async () => {
        vi.mocked(findProjectById).mockResolvedValue(null);
        const r = await getProjectService("u1", "p1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });

    it("maps a row to the ISO-string wire shape", async () => {
        vi.mocked(findProjectById).mockResolvedValue(row);
        const r = await getProjectService("u1", "p1");
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.createdAt).toBe("2026-01-01T00:00:00.000Z");
            expect(r.data.name).toBe("Alpha");
        }
    });
});

describe("createProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns the mapped created project", async () => {
        vi.mocked(createProject).mockResolvedValue(row);
        const r = await createProjectService("u1", { name: "Alpha" });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.id).toBe("p1");
    });
});

describe("deleteProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when nothing was deleted", async () => {
        vi.mocked(deleteProject).mockResolvedValue(null);
        const r = await deleteProjectService("u1", "p1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm exec vitest run src/core/project/server/services`
Expected: PASS (the `server-only` alias lets the service modules import cleanly; mocked repos keep `db` out of the test).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: project services with AsyncAppResult + ownership enforcement"
```

---

### Task 9: Project API routes + domain router

**Files:**
- Create: `src/core/project/server/api/routes/list-projects.route.ts`, `create-project.route.ts`, `get-project.route.ts`, `update-project.route.ts`, `delete-project.route.ts`, `src/core/project/server/api/router.ts`
- Test: none (typecheck; exercised end-to-end in Task 14)

**Interfaces:**
- Consumes: `authed` (Task 5); services (Task 8); `CommonResponse`, `errorToResponse`, `successResponseSchema`, `createdResponseSchema`, `errorResponseSchema` (Task 3); `projectSchema`, `createProjectSchema`, `updateProjectSchema` (Task 6)
- Produces: `projectRouter` (Elysia, `prefix: "/projects"`)

- [ ] **Step 1: Write `list-projects.route.ts` and `create-project.route.ts`**

`list-projects.route.ts`:
```ts
import { Elysia } from "elysia";
import { z } from "zod";
import { projectSchema } from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { listProjectsService } from "../../services/list-projects-service";

export const listProjectsRoute = new Elysia().use(authed).get(
    "/",
    async ({ user, status }) => {
        const result = await listProjectsService(user.id);
        if (!result.ok) return status(result.error.status as 500, errorToResponse(result.error));
        return status(200, CommonResponse.successful({ response: result.data }));
    },
    {
        authed: true,
        response: {
            200: successResponseSchema(z.array(projectSchema), "ProjectList"),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "List the current user's projects" },
    },
);
```

`create-project.route.ts`:
```ts
import { Elysia } from "elysia";
import { createProjectSchema, projectSchema } from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    createdResponseSchema,
    errorResponseSchema,
    errorToResponse,
} from "@/server/common/responses";
import { createProjectService } from "../../services/create-project-service";

export const createProjectRoute = new Elysia().use(authed).post(
    "/",
    async ({ user, body, status }) => {
        const result = await createProjectService(user.id, body);
        if (!result.ok) return status(result.error.status as 500, errorToResponse(result.error));
        return status(201, CommonResponse.created({ response: result.data }));
    },
    {
        authed: true,
        body: createProjectSchema,
        response: {
            201: createdResponseSchema(projectSchema, "Project"),
            400: errorResponseSchema(400),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Create a project" },
    },
);
```

- [ ] **Step 2: Write `get-project.route.ts`**

```ts
import { Elysia } from "elysia";
import { z } from "zod";
import { projectSchema } from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { getProjectService } from "../../services/get-project-service";

export const getProjectRoute = new Elysia().use(authed).get(
    "/:id",
    async ({ user, params, status }) => {
        const result = await getProjectService(user.id, params.id);
        if (!result.ok) return status(result.error.status as 404 | 500, errorToResponse(result.error));
        return status(200, CommonResponse.successful({ response: result.data }));
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        response: {
            200: successResponseSchema(projectSchema, "Project"),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Get a project by id" },
    },
);
```

- [ ] **Step 3: Write `update-project.route.ts` and `delete-project.route.ts`**

`update-project.route.ts`:
```ts
import { Elysia } from "elysia";
import { z } from "zod";
import { projectSchema, updateProjectSchema } from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { updateProjectService } from "../../services/update-project-service";

export const updateProjectRoute = new Elysia().use(authed).put(
    "/:id",
    async ({ user, params, body, status }) => {
        const result = await updateProjectService(user.id, params.id, body);
        if (!result.ok)
            return status(result.error.status as 400 | 404 | 500, errorToResponse(result.error));
        return status(200, CommonResponse.successful({ response: result.data }));
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        body: updateProjectSchema,
        response: {
            200: successResponseSchema(projectSchema, "Project"),
            400: errorResponseSchema(400),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Update a project by id" },
    },
);
```

`delete-project.route.ts`:
```ts
import { Elysia } from "elysia";
import { z } from "zod";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { deleteProjectService } from "../../services/delete-project-service";

export const deleteProjectRoute = new Elysia().use(authed).delete(
    "/:id",
    async ({ user, params, status }) => {
        const result = await deleteProjectService(user.id, params.id);
        if (!result.ok) return status(result.error.status as 404 | 500, errorToResponse(result.error));
        return status(200, CommonResponse.successful({ response: result.data }));
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        response: {
            200: successResponseSchema(z.object({ id: z.string() }), "DeleteProject"),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Delete a project by id" },
    },
);
```

- [ ] **Step 4: Write `router.ts` (the domain router — prefix lives here)**

```ts
import { Elysia } from "elysia";
import { createProjectRoute } from "./routes/create-project.route";
import { deleteProjectRoute } from "./routes/delete-project.route";
import { getProjectRoute } from "./routes/get-project.route";
import { listProjectsRoute } from "./routes/list-projects.route";
import { updateProjectRoute } from "./routes/update-project.route";

export const projectRouter = new Elysia({ prefix: "/projects" })
    .use(listProjectsRoute)
    .use(createProjectRoute)
    .use(getProjectRoute)
    .use(updateProjectRoute)
    .use(deleteProjectRoute);
```

- [ ] **Step 5: Verify + commit**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

```bash
git add -A
git commit -m "feat: project CRUD Elysia routes + domain router"
```

---

### Task 10: Root router, API mount, logging

**Files:**
- Create: `src/server/router.ts`, `src/app/api/v1/[...slugs]/route.ts`, `src/server/logger.ts`, `instrumentation.ts`
- Test: none (`next build` compiles the route in Task 14; typecheck here)

**Interfaces:**
- Consumes: `auth` (Task 5), `projectRouter` (Task 9), `ServerConfig` (Task 2), `APIResponse` (Task 3)
- Produces: `app` (default) + `type AppRouter = typeof app` — the type every Eden client derives from

- [ ] **Step 1: Write `src/server/logger.ts`**

```ts
import { configure, getConsoleSink } from "@logtape/logtape";

let configured = false;

/** Configure LogTape once (idempotent). Called from `instrumentation.ts`. */
export async function configureLogging() {
    if (configured) return;
    configured = true;
    await configure({
        sinks: { console: getConsoleSink() },
        loggers: [
            { category: ["server"], lowestLevel: "debug", sinks: ["console"] },
            { category: ["logtape", "meta"], lowestLevel: "warning", sinks: ["console"] },
        ],
    });
}
```

- [ ] **Step 2: Write `instrumentation.ts` (repo root)**

```ts
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { configureLogging } = await import("./src/server/logger");
        await configureLogging();
    }
}
```

- [ ] **Step 3: Write `src/server/router.ts`**

```ts
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { serverTiming } from "@elysiajs/server-timing";
import { elysiaLogger } from "@logtape/elysia";
import { getLogger } from "@logtape/logtape";
import { Elysia } from "elysia";
import { z } from "zod";
import { ServerConfig } from "@/config/server-config";
import { projectRouter } from "@/core/project/server/api/router";
import { auth } from "./auth/auth";
import type { APIResponse } from "./common/responses";

const apiErrorLogger = getLogger(["server", "error"]);

const betterAuthPlugin = new Elysia({ name: "better-auth" }).mount(auth.handler);

// OpenAPI (Scalar UI at /api/v1/openapi) is dev-only.
const docs = new Elysia({ name: "docs" });
if (ServerConfig.isDevelopment) {
    docs.use(
        openapi({
            documentation: {
                info: {
                    title: ServerConfig.info.name,
                    version: ServerConfig.info.version,
                    description: ServerConfig.info.description,
                },
            },
            mapJsonSchema: { zod: z.toJSONSchema },
        }),
    );
}

const app = new Elysia({ prefix: "/api/v1" })
    .use(betterAuthPlugin)
    .use(
        cors({
            origin: [ServerConfig.baseUrl],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    )
    .use(docs)
    .use(serverTiming())
    .use(elysiaLogger())
    .onError(({ error, code, set, request, path }) => {
        const isValidation = code === "VALIDATION";
        if (!isValidation) {
            apiErrorLogger.error("Unhandled API error {code} on {method} {path}: {error}", {
                code,
                method: request.method,
                path,
                error: error instanceof Error ? (error.stack ?? error.message) : String(error),
            });
        }
        set.status = isValidation ? 400 : 500;
        return {
            code: isValidation ? "VALIDATION" : "INTERNAL_SERVER_ERROR",
            status: isValidation ? 400 : 500,
        } satisfies APIResponse;
    })
    .use(projectRouter);

export default app;
export type AppRouter = typeof app;
```

- [ ] **Step 4: Write `src/app/api/v1/[...slugs]/route.ts`**

```ts
import app from "@/server/router";

export const maxDuration = 60;

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const OPTIONS = app.fetch;
```

- [ ] **Step 5: Verify + commit**

Run: `pnpm exec tsc --noEmit`
Expected: PASS. If Elysia's `onError` destructured params mismatch, adjust to the installed Elysia 1.4 `onError` context (keep `set.status` + returned envelope).

```bash
git add -A
git commit -m "feat: root Elysia router, /api/v1 mount, LogTape config"
```

---

### Task 11: Client data infra + providers

**Files:**
- Create: `src/frontend/lib/eden.ts`, `src/frontend/lib/query-client.ts`, `src/frontend/providers/theme-provider.tsx`, `src/frontend/providers/providers.tsx`
- Test: none (typecheck; wired into layout in Task 14)

**Interfaces:**
- Consumes: `AppRouter` (Task 10), `ClientConfig` (Task 2), `authClient` (Task 5), `Toaster` (Task 12 — imported but generated there; if executing strictly in order, this import resolves once Task 12 runs, and Task 11's typecheck step is deferred to Task 12)
- Produces: `useElysia`, `apiClient`, `EdenProvider`, `getQueryClient()`, `Providers`

> **Ordering note:** `providers.tsx` imports `@/frontend/components/ui/sonner`, generated in Task 12. Do Task 11's file writes, then run Task 12, then run this task's typecheck as part of Task 12's verify. The commit for this task can happen after Task 12's `shadcn add`.

- [ ] **Step 1: Write `src/frontend/lib/eden.ts`**

```ts
import { treaty } from "@elysiajs/eden";
import { createEdenTanStackQuery } from "eden-tanstack-react-query";
import { ClientConfig } from "@/config/client-config";
import type { AppRouter } from "@/server/router";

const BASE_URL = ClientConfig.baseUrl;

const { EdenProvider, useEden } = createEdenTanStackQuery<AppRouter>();
/** Typed options proxy rooted at /api/v1. Bind one domain, then hang calls off it. */
const useElysia = () => useEden().api.v1;

const apiClient = treaty<AppRouter>(BASE_URL);

export { apiClient, EdenProvider, useElysia };
```

- [ ] **Step 2: Write `src/frontend/lib/query-client.ts`**

```ts
import {
    defaultShouldDehydrateQuery,
    isServer,
    QueryClient,
} from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { staleTime: 5000, throwOnError: true },
            dehydrate: {
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) || query.state.status === "pending",
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
    if (isServer) return makeQueryClient();
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}
```

- [ ] **Step 3: Write `src/frontend/providers/theme-provider.tsx`**

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 4: Write `src/frontend/providers/providers.tsx`**

```tsx
"use client";

import { AuthProvider as AuthUIProvider } from "@better-auth-ui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { authClient } from "@/frontend/auth/auth";
import { Toaster } from "@/frontend/components/ui/sonner";
import { apiClient, EdenProvider } from "@/frontend/lib/eden";
import { getQueryClient } from "@/frontend/lib/query-client";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: PropsWithChildren) {
    const queryClient = getQueryClient();
    const router = useRouter();

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <QueryClientProvider client={queryClient}>
                <EdenProvider client={apiClient} queryClient={queryClient}>
                    <AuthUIProvider
                        authClient={authClient}
                        navigate={router.push}
                        replace={router.replace}
                        onSessionChange={() => router.refresh()}
                        Link={Link}
                    >
                        {children}
                        <Toaster />
                    </AuthUIProvider>
                </EdenProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
```

> **API-verify substep:** After Task 12 installs the packages, run `pnpm exec tsc --noEmit`. If `AuthProvider`/`AuthUIProvider` props (`navigate`, `replace`, `Link`, `onSessionChange`) or `EdenProvider` props (`client`, `queryClient`) don't match the installed types, open the package's exported types (`node_modules/@better-auth-ui/react/dist/*.d.ts`, `node_modules/eden-tanstack-react-query/dist/*.d.ts`) and adjust prop names to match. Keep the same wiring intent.

- [ ] **Step 5: (Defer commit to Task 12 after typecheck passes.)**

---

### Task 12: shadcn/ui primitives

**Files:**
- Create (via CLI): `src/frontend/components/ui/{button,input,textarea,card,badge,dialog,label,sonner}.tsx`
- Modify: `package.json` (CLI adds `lucide-react`, `radix-ui`/`@radix-ui/*`, etc.)
- Test: none (typecheck)

**Interfaces:**
- Consumes: `components.json`, `cn` util, `globals.css` (Task 1)
- Produces: `Button`, `Input`, `Textarea`, `Card` (+ `CardHeader/Title/Description/Content/Footer`), `Badge`, `Dialog` (+ parts), `Label`, `Toaster` from `@/frontend/components/ui/*`

- [ ] **Step 1: Add the primitives via the shadcn CLI**

Run:
```bash
pnpm dlx shadcn@latest add button input textarea card badge dialog label sonner --yes
```
Expected: files created under `src/frontend/components/ui/`; `package.json` gains `lucide-react` + radix deps; `pnpm install` run by the CLI.

> If the CLI errors on a non-empty `globals.css` or asks to overwrite, decline overwrites of `globals.css`/`components.json` (answer no / keep existing). The components only need `cn` + the CSS tokens already present.

- [ ] **Step 2: Typecheck the client infra + primitives together**

Run: `pnpm exec tsc --noEmit`
Expected: PASS. Resolve any `@better-auth-ui`/`eden` provider prop mismatches per the Task 11 API-verify substep now.

- [ ] **Step 3: Commit (client infra + primitives)**

```bash
git add -A
git commit -m "feat: shadcn primitives + Eden/query client + providers"
```

---

### Task 13: Project client hooks + UI

**Files:**
- Create: `src/core/project/client/hooks.ts`, `src/core/project/client/ui/project-card.tsx`, `project-form.tsx`, `project-screen.tsx`
- Test: none (typecheck; exercised end-to-end in Task 14)

**Interfaces:**
- Consumes: `useElysia` (Task 11); shadcn primitives (Task 12); domain types (Task 6); `toast` from `sonner`
- Produces:
  - hooks: `useProjects()`, `useProject(id)`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`
  - components: `ProjectScreen`, `ProjectForm`, `ProjectCard`

- [ ] **Step 1: Write `src/core/project/client/hooks.ts`**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateProject, Project, UpdateProject } from "@/core/project/domain/types";
import { useElysia } from "@/frontend/lib/eden";

/** Bind the projects domain once; every call hangs off `client`. */
function useProjectsClient() {
    return useElysia().projects;
}

export function useProjects() {
    const client = useProjectsClient();
    const query = useQuery(client.get.queryOptions());
    return { ...query, projects: query.data?.response ?? [] };
}

export function useProject(id: string | undefined) {
    const client = useProjectsClient();
    return useQuery({ ...client({ id: id ?? "" }).get.queryOptions(), enabled: !!id });
}

export function useCreateProject() {
    const client = useProjectsClient();
    const queryClient = useQueryClient();
    const listKey = client.get.queryKey();
    return useMutation({
        ...client.post.mutationOptions(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}

export function useUpdateProject() {
    const client = useProjectsClient();
    const queryClient = useQueryClient();
    const listKey = client.get.queryKey();
    return useMutation({
        mutationFn: (vars: { id: string; data: UpdateProject }) =>
            client({ id: vars.id }).put.mutationOptions().mutationFn(vars.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}

export function useDeleteProject() {
    const client = useProjectsClient();
    const queryClient = useQueryClient();
    const listKey = client.get.queryKey();
    return useMutation({
        mutationFn: (id: string) => client({ id }).delete.mutationOptions().mutationFn(undefined),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}

/** Sanctioned mutation-result unwrap (Eden's mutationFn returns `unknown`). */
export function unwrapProject(result: unknown): Project {
    return (result as { response: Project }).response;
}

export type { CreateProject, Project, UpdateProject };
```

> **API-verify substep:** `client({ id }).put`/`.delete` dynamic-path mutation access and `.mutationFn(arg)` arity depend on `eden-tanstack-react-query` 0.1.x. If TS rejects a call, check the proxy's emitted types and adjust (the intent: POST `/projects`, PUT/DELETE `/projects/:id`, list key from `client.get.queryKey()`). Do not fall back to raw `apiClient` inside these hooks.

- [ ] **Step 2: Write `src/core/project/client/ui/project-card.tsx`**

```tsx
"use client";

import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import type { Project } from "@/core/project/domain/types";

export function ProjectCard({
    project,
    onEdit,
    onDelete,
    deleting,
}: {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    deleting: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="truncate">{project.name}</CardTitle>
                <Badge variant={project.status === "active" ? "default" : "secondary"}>
                    {project.status}
                </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                {project.description || "No description"}
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
                    Edit
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting}
                    onClick={() => onDelete(project.id)}
                >
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
}
```

- [ ] **Step 3: Write `src/core/project/client/ui/project-form.tsx`**

```tsx
"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import {
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import type { CreateProject, Project, ProjectStatus } from "@/core/project/domain/types";

export function ProjectForm({
    editing,
    submitting,
    onSubmit,
}: {
    editing: Project | null;
    submitting: boolean;
    onSubmit: (values: CreateProject) => void;
}) {
    const [name, setName] = useState(editing?.name ?? "");
    const [description, setDescription] = useState(editing?.description ?? "");
    const [status, setStatus] = useState<ProjectStatus>(editing?.status ?? "active");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), description: description.trim() || undefined, status });
    }

    return (
        <DialogContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    >
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                    </select>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={submitting}>
                        {editing ? "Save" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
```

- [ ] **Step 4: Write `src/core/project/client/ui/project-screen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Dialog, DialogTrigger } from "@/frontend/components/ui/dialog";
import type { CreateProject, Project } from "@/core/project/domain/types";
import {
    useCreateProject,
    useDeleteProject,
    useProjects,
    useUpdateProject,
} from "../hooks";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";

export function ProjectScreen() {
    const { projects, isLoading } = useProjects();
    const createProject = useCreateProject();
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Project | null>(null);

    function openCreate() {
        setEditing(null);
        setOpen(true);
    }

    function openEdit(project: Project) {
        setEditing(project);
        setOpen(true);
    }

    function handleSubmit(values: CreateProject) {
        if (editing) {
            updateProject.mutate(
                { id: editing.id, data: values },
                {
                    onSuccess: () => {
                        toast.success("Project updated");
                        setOpen(false);
                    },
                    onError: () => toast.error("Update failed"),
                },
            );
            return;
        }
        createProject.mutate(values, {
            onSuccess: () => {
                toast.success("Project created");
                setOpen(false);
            },
            onError: () => toast.error("Create failed"),
        });
    }

    function handleDelete(id: string) {
        deleteProject.mutate(id, {
            onSuccess: () => toast.success("Project deleted"),
            onError: () => toast.error("Delete failed"),
        });
    }

    return (
        <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-2xl">Projects</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>New project</Button>
                    </DialogTrigger>
                    <ProjectForm
                        editing={editing}
                        submitting={createProject.isPending || updateProject.isPending}
                        onSubmit={handleSubmit}
                    />
                </Dialog>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
            ) : projects.length === 0 ? (
                <p className="text-muted-foreground text-sm">No projects yet. Create your first one.</p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            deleting={deleteProject.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 5: Verify + commit**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (resolve Eden proxy typing per the Step 1 API-verify substep if needed).

```bash
git add -A
git commit -m "feat: project client hooks + CRUD UI (list/create/edit/delete)"
```

---

### Task 14: App shell & routes

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/sign-out-button.tsx`, `src/app/(app)/projects/page.tsx`, `src/app/auth/[path]/page.tsx`
- Test: end-to-end via `pnpm build`

**Interfaces:**
- Consumes: `Providers` (Task 11), `authenticate`/`requireAuth` (Task 5), `ProjectScreen` (Task 13), `authClient` (Task 5), `AuthCard` (`@better-auth-ui/react`)
- Produces: the full routed app

- [ ] **Step 1: Write `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Providers } from "@/frontend/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
    title: "Hackaton Starter",
    description: "Next + Elysia + Better Auth + Drizzle starter",
};

export default function RootLayout({ children }: PropsWithChildren) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-svh antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
```

- [ ] **Step 2: Write `src/app/page.tsx` (landing redirect)**

```tsx
import { redirect } from "next/navigation";
import { authenticate } from "@/server/auth/auth";

export default async function HomePage() {
    const session = await authenticate();
    redirect(session ? "/projects" : "/auth/sign-in");
}
```

- [ ] **Step 3: Write `src/app/(app)/sign-out-button.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { authClient } from "@/frontend/auth/auth";

export function SignOutButton() {
    const router = useRouter();
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={async () => {
                await authClient.signOut();
                router.push("/auth/sign-in");
            }}
        >
            Sign out
        </Button>
    );
}
```

- [ ] **Step 4: Write `src/app/(app)/layout.tsx` (authed shell)**

```tsx
import type { PropsWithChildren } from "react";
import { requireAuth } from "@/server/auth/require-auth";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: PropsWithChildren) {
    const { user } = await requireAuth();
    return (
        <div className="min-h-svh">
            <header className="flex items-center justify-between border-b px-6 py-3">
                <span className="font-semibold">Hackaton Starter</span>
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                    <span>{user.email}</span>
                    <SignOutButton />
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
```

- [ ] **Step 5: Write `src/app/(app)/projects/page.tsx`**

```tsx
import { ProjectScreen } from "@/core/project/client/ui/project-screen";

export default function ProjectsPage() {
    return <ProjectScreen />;
}
```

- [ ] **Step 6: Write `src/app/auth/[path]/page.tsx`**

```tsx
import { AuthCard } from "@better-auth-ui/react";

export function generateStaticParams() {
    return ["sign-in", "sign-up", "forgot-password", "reset-password", "sign-out"].map((path) => ({
        path,
    }));
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
    const { path } = await params;
    return (
        <main className="flex min-h-svh items-center justify-center p-4">
            <AuthCard pathname={path} />
        </main>
    );
}
```

> **API-verify substep:** `AuthCard`'s current path prop is `pathname` in `@better-auth-ui/react` 1.6.x. If the installed types name it differently (`path`, `view`), adjust. The `generateStaticParams` list must cover the auth views you link to.

- [ ] **Step 7: Build**

Run: `pnpm build`
Expected: build succeeds; `/api/v1/[...slugs]`, `/`, `/(app)/projects`, `/auth/[path]` all compile. Fix any type/prop mismatches surfaced (per the API-verify substeps in Tasks 11/13/14).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: app shell, landing redirect, authed layout, auth pages"
```

---

### Task 15: README + full verification + delivery

**Files:**
- Create: `README.md`
- Test: full pipeline (`biome`, `vitest`, `tsc`, `build`)

**Interfaces:**
- Consumes: everything.
- Produces: the documented, verified starter.

- [ ] **Step 1: Write `README.md`**

````markdown
# hackaton-starter

Opinionated Next 16 starter: **Elysia API + Better Auth + Drizzle/Postgres +
Eden/TanStack Query**, with a Result-pattern response envelope and one
`Project` CRUD domain to clone. No Firebase — Postgres only.

## Stack

Next 16 · React 19 · Elysia (`/api/v1`) · Better Auth (email+password) ·
Drizzle ORM + node-postgres · Eden + `eden-tanstack-react-query` · zod ·
shadcn/ui + Tailwind v4 · LogTape · Vitest · Biome.

## Setup

```bash
pnpm install
cp .env.example .env      # fill DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
pnpm db:migrate           # apply migrations to your Postgres
pnpm dev                  # http://localhost:3000
```

`BETTER_AUTH_SECRET`: `openssl rand -base64 32`. `DATABASE_URL`: any Postgres
(Supabase, Neon, local). Env is validated at boot by `src/config/env.ts`.

## Architecture

Domains live under `src/core/<domain>/`:

| Layer | Holds |
|-------|-------|
| `domain/` | zod `schemas.ts` + inferred `types.ts` (single type source) |
| `server/repository/` | Drizzle access (`import "server-only"` + shared `db`) |
| `server/services/` | orchestration, returns `AsyncAppResult<T>`, enforces ownership |
| `server/api/` | Elysia leaf `*.route.ts` + a domain `router.ts` (prefix) |
| `client/` | Eden/TanStack-Query hooks + shadcn UI |

Wire rules: every response is the `CommonResponse` envelope
(`{ response?, code, status }`); expected 4xx are `err(AppErrors.x)` values, not
throws; authed routes carry both `.use(authed)` and `authed: true`.

### Add a new domain

Clone `src/core/project/` → `src/core/<domain>/`, add a
`schemas/<domain>-schema.ts` Drizzle table (export from `schemas/index.ts`),
then wire the domain router into `src/server/router.ts` with `.use(<domain>Router)`.
**A router isn't live until it's `.use()`d in `server/router.ts`.**
Regenerate + apply migrations: `pnpm db:generate && pnpm db:migrate`.

## Scripts

`pnpm dev | build | start` · `pnpm test` · `pnpm check` (Biome) ·
`pnpm typecheck` · `pnpm db:generate | db:migrate | db:studio`.

## Known notes

- OpenAPI (Scalar) is dev-only at `/api/v1/openapi`.
- `eden-tanstack-react-query` is at `^0.1.10`; if a proxy typing breaks after an
  upgrade, pin it.
````

- [ ] **Step 2: Run the full verification pipeline**

Run: `pnpm exec biome check .`
Expected: PASS (run `pnpm run check:fix` to auto-fix formatting, then re-check).

Run: `pnpm exec vitest run`
Expected: all suites PASS.

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: README; verify full build/test pipeline"
```

- [ ] **Step 4: Publish to GitHub (confirm with user first)**

> Do NOT run until the user confirms. Outward-facing / creates a public-ish artifact.

```bash
gh repo create hackaton-starter --private --source . --push
```

---

## Self-Review

**Spec coverage:**
- Single Next app, no workspace → Task 1. ✓
- Elysia `/api/v1` + mount → Tasks 10. ✓
- Better Auth email+password + drizzle adapter + `@better-auth-ui` → Tasks 5, 11, 14. ✓
- Drizzle/Postgres, `DATABASE_URL` via `ServerConfig` → Tasks 2, 4. ✓
- Eden + TanStack Query client → Tasks 11, 13. ✓
- zod domain schemas → Task 6. ✓
- Result envelope, AI-quota trimmed → Task 3. ✓
- LogTape → Task 10. ✓
- `Project` CRUD (domain/repo/service/route/hooks/UI) → Tasks 6–9, 13. ✓
- Ownership scoping by `userId` → Tasks 7 (repo `and(id,userId)`), 8 (service notFound). ✓
- Full CRUD UI (shadcn) → Tasks 12, 13. ✓
- App routes (landing, authed shell, projects, auth) → Task 14. ✓
- Tooling (biome/tsc/vitest/tailwind/drizzle.config/migrate) → Task 1. ✓
- Repo/git/gh delivery → Task 15. ✓

**Placeholder scan:** No "TBD"/"implement later". The three "API-verify substeps" (Tasks 11, 13, 14) specify exact intent + where to check installed types; they are integration-seam confirmations against installed package versions, not missing logic.

**Type consistency:** `ProjectRow`/`NewProjectRow` (Drizzle) vs `Project` (domain) used consistently; service signatures `(userId, id[, input])` match route call sites; `toProject` used everywhere Date→ISO is needed; `client.get.queryKey()` list key reused across mutation hooks.
