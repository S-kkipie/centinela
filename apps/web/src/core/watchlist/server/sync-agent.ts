import "server-only";
import type { WatchTarget } from "@centinela/contracts/watch";
import { env } from "@/config/env";
import { findUserTargets } from "./repository/find-user-targets";

/**
 * Pushes a user's full target list to the living agent, so a watchlist change in
 * the web app actually changes what the agent sweeps.
 *
 * The web app is the source of truth: this sends the ENTIRE list (replace
 * semantics via the agent's `/set`), so removals propagate, not just additions.
 * One DO instance per user (`user-<id>`); hitting it also boots the instance,
 * whose onStart schedules the heartbeat.
 *
 * Best-effort and non-blocking by contract: a watchlist edit must succeed even
 * if the agent is unreachable. Callers `void` this and never await its failure.
 */
export async function syncAgentForUser(userId: string): Promise<void> {
    if (!env.AGENT_URL) return; // agent not wired in this environment

    let targets: WatchTarget[];
    try {
        targets = await findUserTargets(userId);
    } catch (cause) {
        console.error("[sync-agent] could not read targets", { userId, cause });
        return;
    }

    const url = `${env.AGENT_URL.replace(/\/$/, "")}/agents/centinela-agent/user-${userId}/set`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-agent-key": env.AGENT_INGEST_KEY,
            },
            body: JSON.stringify({ targets }),
            // Never let a slow agent hang a user's request.
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            console.error("[sync-agent] agent rejected sync", {
                userId,
                status: res.status,
            });
        }
    } catch (cause) {
        // Unreachable agent / timeout: the next mutation re-syncs the full list,
        // so a dropped push is self-healing.
        console.error("[sync-agent] push failed", { userId, cause });
    }
}
