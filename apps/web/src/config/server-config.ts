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
