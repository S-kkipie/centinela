import type { z } from "zod";
import type {
    addWatchlistEntitySchema,
    createWatchlistSchema,
    updateWatchlistSchema,
    watchlistEntitySchema,
    watchlistSchema,
    watchlistWithEntitiesSchema,
} from "./schemas";

export type Watchlist = z.infer<typeof watchlistSchema>;
export type CreateWatchlist = z.infer<typeof createWatchlistSchema>;
export type UpdateWatchlist = z.infer<typeof updateWatchlistSchema>;
export type WatchlistEntity = z.infer<typeof watchlistEntitySchema>;
export type AddWatchlistEntity = z.infer<typeof addWatchlistEntitySchema>;
export type WatchlistWithEntities = z.infer<typeof watchlistWithEntitiesSchema>;
