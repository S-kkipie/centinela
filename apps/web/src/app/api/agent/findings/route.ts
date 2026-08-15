import { validateFindingIngest } from "@centinela/contracts/finding";
import { ServerConfig } from "@/config/server-config";
import { matchesAgentKey } from "@/core/finding/server/agent-key";
import { ingestFindingService } from "@/core/finding/server/services/ingest-finding-service";

export const maxDuration = 60;

/**
 * Machine-to-machine ingest for the living agent (WS3). Deliberately mounted
 * OUTSIDE the session-authed `/api/v1` Elysia app: auth is a shared secret in
 * the `x-agent-key` header, per the `@centinela/contracts` contract.
 */
export async function POST(request: Request): Promise<Response> {
    if (
        !matchesAgentKey(
            request.headers.get("x-agent-key"),
            ServerConfig.agentIngestKey,
        )
    ) {
        return Response.json(
            { code: "UNAUTHORIZED", status: 401 },
            { status: 401 },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json(
            { code: "INVALID_BODY", status: 400, errors: ["invalid JSON"] },
            { status: 400 },
        );
    }

    const parsed = validateFindingIngest(body);
    if (!parsed.ok) {
        return Response.json(
            { code: "INVALID_BODY", status: 400, errors: parsed.errors },
            { status: 400 },
        );
    }

    const result = await ingestFindingService(parsed.value);
    if (!result.ok) {
        return Response.json(
            { code: result.error.code, status: 500 },
            { status: 500 },
        );
    }

    return Response.json(
        { code: "OK", status: 200, response: result.data },
        { status: 200 },
    );
}
