import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    type WatchlistRow,
    watchlists,
} from "@/server/drizzle/schemas/watchlist-schema";

/** All of a user's watchlists, newest first. */
export async function findWatchlists(userId: string): Promise<WatchlistRow[]> {
    return db
        .select()
        .from(watchlists)
        .where(eq(watchlists.userId, userId))
        .orderBy(desc(watchlists.createdAt));
}
