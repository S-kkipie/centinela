import "server-only";
import { and, eq } from "drizzle-orm";
import type { UpdateWatchlist } from "@/core/watchlist/domain/types";
import { db } from "@/server/drizzle/db";
import {
    type WatchlistRow,
    watchlists,
} from "@/server/drizzle/schemas/watchlist-schema";

/** Update a watchlist scoped to its owner — null if missing or foreign. */
export async function updateWatchlist(
    userId: string,
    id: string,
    values: UpdateWatchlist,
): Promise<WatchlistRow | null> {
    const [row] = await db
        .update(watchlists)
        .set(values)
        .where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)))
        .returning();
    return row ?? null;
}
