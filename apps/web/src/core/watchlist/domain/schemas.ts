import { z } from "zod";

/** Wire shape: timestamps ISO strings (mapped from Date at the repo boundary). */
export const watchlistSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createWatchlistSchema = z.object({
    name: z.string().trim().min(1).max(200),
});

export const updateWatchlistSchema = z.object({
    name: z.string().trim().min(1).max(200).optional(),
});

export const watchlistEntitySchema = z.object({
    id: z.string(),
    watchlistId: z.string(),
    nit: z.string(),
    name: z.string(),
    createdAt: z.string(),
});

export const addWatchlistEntitySchema = z.object({
    nit: z.string().trim().min(1).max(50),
    name: z.string().trim().min(1).max(200),
});

/** A watchlist with its watched entities inlined, for the detail view. */
export const watchlistWithEntitiesSchema = watchlistSchema.extend({
    entities: z.array(watchlistEntitySchema),
});
