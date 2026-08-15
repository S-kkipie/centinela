import "server-only";
// `@copilotkit/runtime/v2` imports `reflect-metadata` itself; no need to add it.
import {
    BuiltInAgent,
    CopilotRuntime,
    createCopilotEndpoint,
} from "@copilotkit/runtime/v2";
import {
    COPILOT_AGENT_ID,
    COPILOT_MODEL,
    SYSTEM_PROMPT,
} from "@/core/copilot/client/config";

/**
 * CopilotKit v2 runtime, built lazily and memoized. Kept out of `route.ts` so
 * the auth guard never pays for booting the runtime (and stays easy to test).
 *
 * The `google/…` model reuses the existing `GEMINI_API_KEY`, passed explicitly
 * so we don't depend on CopilotKit's `GOOGLE_API_KEY` env fallback. Missing key
 * throws here → surfaces as a chat error; the rest of the app is unaffected
 * (the copilot is additive).
 */

const BASE_PATH = "/api/copilotkit";

type FetchApp = { fetch: (request: Request) => Response | Promise<Response> };

let cachedApp: FetchApp | null = null;

function buildApp(): FetchApp {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY no está configurada; el copiloto no puede iniciar.",
        );
    }

    const agent = new BuiltInAgent({
        model: COPILOT_MODEL,
        apiKey,
        prompt: SYSTEM_PROMPT,
        // Let the agent chain tool calls (filter → open → explain) in one turn.
        maxSteps: 8,
    });

    const runtime = new CopilotRuntime({
        agents: { [COPILOT_AGENT_ID]: agent },
    });

    return createCopilotEndpoint({
        runtime,
        basePath: BASE_PATH,
        mode: "single-route",
    });
}

export async function handleCopilotRequest(
    request: Request,
): Promise<Response> {
    if (!cachedApp) cachedApp = buildApp();
    return cachedApp.fetch(request);
}
