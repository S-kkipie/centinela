import "server-only";
import { db } from "@/server/drizzle/db";
import {
    type WatchlistRow,
    watchlists,
} from "@/server/drizzle/schemas/watchlist-schema";

export async function createWatchlist(values: {
    userId: string;
    name: string;
}): Promise<WatchlistRow> {
    const [row] = await db.insert(watchlists).values(values).returning();
    return row;
}
