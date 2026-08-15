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
