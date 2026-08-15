import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { watchlistEntities } from "@/server/drizzle/schemas/watchlist-schema";

/** Watchlists whose watched entities include this NIT — where a finding lands. */
export async function findWatchlistIdsByEntityNit(
    nit: string,
): Promise<string[]> {
    const rows = await db
        .select({ watchlistId: watchlistEntities.watchlistId })
        .from(watchlistEntities)
        .where(eq(watchlistEntities.nit, nit));
    return rows.map((r) => r.watchlistId);
}
