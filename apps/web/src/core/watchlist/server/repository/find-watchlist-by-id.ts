import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    type WatchlistEntityRow,
    type WatchlistRow,
    watchlistEntities,
    watchlists,
} from "@/server/drizzle/schemas/watchlist-schema";

/** A watchlist scoped to its owner — null if missing or foreign. */
export async function findWatchlistById(
    userId: string,
    id: string,
): Promise<WatchlistRow | null> {
    const [row] = await db
        .select()
        .from(watchlists)
        .where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)))
        .limit(1);
    return row ?? null;
}

export async function findWatchlistEntities(
    watchlistId: string,
): Promise<WatchlistEntityRow[]> {
    return db
        .select()
        .from(watchlistEntities)
        .where(eq(watchlistEntities.watchlistId, watchlistId))
        .orderBy(asc(watchlistEntities.name));
}
