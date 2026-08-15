import type { Watchlist, WatchlistEntity } from "@/core/watchlist/domain/types";
import type {
    WatchlistEntityRow,
    WatchlistRow,
} from "@/server/drizzle/schemas/watchlist-schema";

export function toWatchlist(row: WatchlistRow): Watchlist {
    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function toWatchlistEntity(row: WatchlistEntityRow): WatchlistEntity {
    return {
        id: row.id,
        watchlistId: row.watchlistId,
        nit: row.nit,
        name: row.name,
        kind: row.kind,
        createdAt: row.createdAt.toISOString(),
    };
}
