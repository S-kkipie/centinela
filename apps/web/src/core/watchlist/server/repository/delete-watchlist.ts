import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { watchlists } from "@/server/drizzle/schemas/watchlist-schema";

/** Delete a watchlist scoped to its owner — returns its id, or null if none. */
export async function deleteWatchlist(
    userId: string,
    id: string,
): Promise<{ id: string } | null> {
    const [row] = await db
        .delete(watchlists)
        .where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)))
        .returning({ id: watchlists.id });
    return row ?? null;
}
