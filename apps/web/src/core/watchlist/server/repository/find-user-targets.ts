import "server-only";
import type { WatchTarget } from "@centinela/contracts/watch";
import { eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    watchlistEntities,
    watchlists,
} from "@/server/drizzle/schemas/watchlist-schema";

/**
 * Every target the user watches, across all their watchlists, deduped by NIT.
 *
 * This is what the agent sweeps: one DO instance per user holds the union of
 * their frentes. Attribution back to individual watchlists happens at ingest
 * time by NIT, so the agent needs the flat list, not the grouping.
 */
export async function findUserTargets(userId: string): Promise<WatchTarget[]> {
    const rows = await db
        .select({
            nit: watchlistEntities.nit,
            name: watchlistEntities.name,
            kind: watchlistEntities.kind,
        })
        .from(watchlistEntities)
        .innerJoin(
            watchlists,
            eq(watchlistEntities.watchlistId, watchlists.id),
        )
        .where(eq(watchlists.userId, userId));

    const byNit = new Map<string, WatchTarget>();
    for (const r of rows) byNit.set(r.nit, r);
    return [...byNit.values()];
}
