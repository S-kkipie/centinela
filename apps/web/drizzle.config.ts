import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/server/drizzle/schemas/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    casing: "snake_case",
    dbCredentials: {
        // biome-ignore lint/style/noNonNullAssertion: drizzle-kit CLI reads the raw env
        url: (process.env.DIRECT_URL ?? process.env.DATABASE_URL)!,
    },
});
