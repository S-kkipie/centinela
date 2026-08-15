import { authenticate } from "@/server/auth/auth";

export const maxDuration = 60;

/**
 * CopilotKit v2 runtime endpoint (single-route mode — the client pairs this with
 * `useSingleEndpoint`). Session-gated with the same Better Auth check the rest of
 * the app uses: no session → 401, and the runtime (Gemini) is never booted.
 *
 * The runtime is loaded lazily *after* the auth check so an unauthenticated
 * request costs nothing and the guard stays trivially testable.
 */

function unauthorized(): Response {
    return Response.json(
        { code: "UNAUTHORIZED", status: 401 },
        { status: 401 },
    );
}

async function handle(request: Request): Promise<Response> {
    const session = await authenticate();
    if (!session) return unauthorized();
    const { handleCopilotRequest } = await import("./runtime");
    return handleCopilotRequest(request);
}

export function POST(request: Request): Promise<Response> {
    return handle(request);
}

export function GET(request: Request): Promise<Response> {
    return handle(request);
}

export function OPTIONS(request: Request): Promise<Response> {
    return handle(request);
}
