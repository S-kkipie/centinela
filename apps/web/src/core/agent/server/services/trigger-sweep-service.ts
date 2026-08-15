import "server-only";
import { env } from "@/config/env";
import { findUserTargets } from "@/core/watchlist/server/repository/find-user-targets";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";

export type SweepResult = {
    /** Tenders fanned onto the investigation queue this tick. */
    enqueued: number;
    /** New/changed tenders detected across the user's targets. */
    detected: number;
    /** Targets the agent swept — 0 means nothing to do. */
    targets: number;
};

/**
 * Fires a manual heartbeat for the signed-in user's agent instance.
 *
 * The living agent normally sweeps every two hours; this lets a user (or the
 * copilot) run one now — the difference between "wait" and "show me". It first
 * re-pushes the user's targets (so a DO created before the sync existed is not
 * empty), then triggers the sweep on the same `user-<id>` instance.
 *
 * The sweep only ENQUEUES; the investigation Workflow runs async on Cloudflare,
 * so even if this call times out the findings still land. Returns NOT_FOUND-ish
 * guidance when the user has no targets to sweep.
 */
export async function triggerSweepService(
    userId: string,
): AsyncAppResult<SweepResult> {
    if (!env.AGENT_URL) {
        return err(
            AppErrors.unexpected(new Error("AGENT_URL no está configurada")),
        );
    }

    const targets = await findUserTargets(userId);
    if (targets.length === 0) {
        // Nothing to sweep — the client maps this 400 to a "create a frente"
        // hint.
        return err(AppErrors.invalidBody({ targets: ["targets"] }));
    }

    const base = `${env.AGENT_URL.replace(/\/$/, "")}/agents/centinela-agent/user-${userId}`;
    const headers = {
        "content-type": "application/json",
        "x-agent-key": env.AGENT_INGEST_KEY,
    };

    try {
        // Make sure the instance holds the current targets before it sweeps.
        await fetch(`${base}/set`, {
            method: "POST",
            headers,
            body: JSON.stringify({ targets }),
            signal: AbortSignal.timeout(8000),
        });

        const res = await fetch(`${base}/sweep`, {
            method: "POST",
            headers,
            // The sweep hits Croma once per target; give it room but stay under
            // the serverless ceiling.
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) {
            return err(
                AppErrors.unexpected(
                    new Error(`El agente respondió ${res.status}`),
                ),
            );
        }
        const body = (await res.json()) as {
            enqueued?: number;
            detected?: number;
        };
        return ok({
            enqueued: body.enqueued ?? 0,
            detected: body.detected ?? 0,
            targets: targets.length,
        });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
