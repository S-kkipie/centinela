import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgTable,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * A user's set of watched SECOP contracting entities. The living agent runs one
 * sweep per watchlist. Findings and graph edges hang off a watchlist. Cloned
 * the starter’s reference domain pattern (user-owned, cascade delete).
 */
export const watchlists = pgTable(
    "watchlists",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("watchlists_user_id_idx").on(table.userId),
        check(
            "watchlists_name_not_empty",
            sql`length(trim(${table.name})) > 0`,
        ),
    ],
);

/**
 * The SECOP contracting entities watched by a watchlist. `nit` is the entity's
 * Colombian tax id — the key the agent sweeps and the ingest maps findings back
 * to. Unique per watchlist so an entity is not watched twice.
 */
export const watchlistEntities = pgTable(
    "watchlist_entities",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        watchlistId: text("watchlist_id")
            .notNull()
            .references(() => watchlists.id, { onDelete: "cascade" }),
        nit: text("nit").notNull(),
        name: text("name").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("watchlist_entities_watchlist_id_idx").on(table.watchlistId),
        index("watchlist_entities_nit_idx").on(table.nit),
        unique("watchlist_entities_watchlist_nit_uq").on(
            table.watchlistId,
            table.nit,
        ),
        check(
            "watchlist_entities_nit_not_empty",
            sql`length(trim(${table.nit})) > 0`,
        ),
    ],
);

export type WatchlistRow = typeof watchlists.$inferSelect;
export type NewWatchlistRow = typeof watchlists.$inferInsert;
export type WatchlistEntityRow = typeof watchlistEntities.$inferSelect;
export type NewWatchlistEntityRow = typeof watchlistEntities.$inferInsert;
