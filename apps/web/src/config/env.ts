import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        DATABASE_URL: z.url(),
        BETTER_AUTH_SECRET: z.string().min(32),
        AGENT_INGEST_KEY: z.string().min(16),
        // Base URL of the living agent Worker. Optional: without it the
        // watchlist→agent sync is a no-op (dev without the Worker still works).
        AGENT_URL: z.url().optional(),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.url(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        AGENT_INGEST_KEY: process.env.AGENT_INGEST_KEY,
        AGENT_URL: process.env.AGENT_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    emptyStringAsUndefined: true,
});
