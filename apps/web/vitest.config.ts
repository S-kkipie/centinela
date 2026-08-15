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
        include: ["src/**/__tests__/**/*.test.ts"],
        env: {
            DATABASE_URL: "postgres://user:pass@localhost:5432/app",
            BETTER_AUTH_SECRET: "test-secret-least-thirty-two-chars-long",
            NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        },
    },
});
