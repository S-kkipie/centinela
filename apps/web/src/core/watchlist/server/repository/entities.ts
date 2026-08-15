import "server-only";
import { and, eq } from "drizzle-orm";
import type { AddWatchlistEntity } from "@/core/watchlist/domain/types";
import { db } from "@/server/drizzle/db";
import {
    type WatchlistEntityRow,
    watchlistEntities,
} from "@/server/drizzle/schemas/watchlist-schema";

/**
 * Add a watched target. Idempotent on `(watchlist_id, nit)` — a re-add refreshes
 * the name and the kind, so correcting a target mistakenly filed as a
 * contracting entity is just adding it again.
 */
export async function addWatchlistEntity(
    watchlistId: string,
    values: AddWatchlistEntity,
): Promise<WatchlistEntityRow> {
    const [row] = await db
        .insert(watchlistEntities)
        .values({ watchlistId, ...values })
        .onConflictDoUpdate({
            target: [watchlistEntities.watchlistId, watchlistEntities.nit],
            set: { name: values.name, kind: values.kind },
        })
        .returning();
    return row;
}

/** Remove a watched entity from a watchlist — returns its id, or null if none. */
export async function removeWatchlistEntity(
    watchlistId: string,
    entityId: string,
): Promise<{ id: string } | null> {
    const [row] = await db
        .delete(watchlistEntities)
        .where(
            and(
                eq(watchlistEntities.id, entityId),
                eq(watchlistEntities.watchlistId, watchlistId),
            ),
        )
        .returning({ id: watchlistEntities.id });
    return row ?? null;
}
