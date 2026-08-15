import { createAuthClient } from "better-auth/react";
import { ClientConfig } from "@/config/client-config";

export const authClient = createAuthClient({
    baseURL: ClientConfig.baseUrl,
    basePath: "/api/v1/auth",
});
