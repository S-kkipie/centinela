import "server-only";
import type { WatchTarget } from "@centinela/contracts/watch";
import { createWatchlist } from "@/core/watchlist/server/repository/create-watchlist";
import { addWatchlistEntity } from "@/core/watchlist/server/repository/entities";
import { syncAgentForUser } from "@/core/watchlist/server/sync-agent";
import { replaceGraphEdges } from "../repository/replace-graph-edges";
import { upsertFinding } from "../repository/upsert-finding";
import { DEMO_FINDINGS } from "./demo-findings";

/** The frente every new account starts with, and what its agent sweeps live. */
const DEMO_FRENTE_NAME = "Contratación territorial";
const DEMO_TARGETS: readonly WatchTarget[] = [
    {
        nit: "899999061",
        name: "Alcaldía Mayor de Bogotá D.C.",
        kind: "contratante",
    },
    { nit: "890905211", name: "Municipio de Medellín", kind: "contratante" },
    {
        nit: "899999114",
        name: "Departamento de Cundinamarca",
        kind: "contratante",
    },
];

/**
 * Populates a brand-new account so its first view is a live-looking console, not
 * an empty one. Creates a demo frente, backfills real (previously-swept)
 * findings and their graph edges, then hands the same targets to the agent so
 * its heartbeat keeps the account fresh.
 *
 * Best-effort: a failure here must never block sign-up, so callers swallow
 * errors — the user simply lands on the normal empty console.
 */
export async function seedDemoForUser(userId: string): Promise<void> {
    const watchlist = await createWatchlist({
        userId,
        name: DEMO_FRENTE_NAME,
    });

    for (const target of DEMO_TARGETS) {
        await addWatchlistEntity(watchlist.id, {
            nit: target.nit,
            name: target.name,
            kind: target.kind,
        });
    }

    for (const finding of DEMO_FINDINGS) {
        const row = await upsertFinding(watchlist.id, finding);
        await replaceGraphEdges(
            row.id,
            finding.graphEdges.map((e) => ({
                watchlistId: watchlist.id,
                findingId: row.id,
                fromNit: e.from,
                toNit: e.to,
                relation: e.relation,
            })),
        );
    }

    // Give the live agent the same targets so the seeded account keeps sweeping.
    await syncAgentForUser(userId);
}
