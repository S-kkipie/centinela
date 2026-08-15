import { env } from "./env";

export const ClientConfig = {
    baseUrl: env.NEXT_PUBLIC_APP_URL,
} as const;
