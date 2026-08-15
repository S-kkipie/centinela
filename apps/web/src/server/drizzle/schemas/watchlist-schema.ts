import {
    DEFAULT_WATCH_TARGET_KIND,
    type WatchTargetKind,
} from "@centinela/contracts/watch";
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
 * The SECOP targets watched by a watchlist. `nit` is the Colombian tax id — the
 * key the agent sweeps and the ingest maps findings back to. Unique per
 * watchlist so a target is not watched twice.
 *
 * `kind` decides which endpoint the sweep calls, and therefore what the target
 * buys you: a `contratante` surfaces that entity's new tenders, while a
 * `contratista` surfaces its awards across every entity in the country —
 * coverage the user never had to watch for.
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
        // Defaulted so existing rows — all contracting entities — stay valid.
        kind: text("kind")
            .notNull()
            .default(DEFAULT_WATCH_TARGET_KIND)
            .$type<WatchTargetKind>(),
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
        check(
            "watchlist_entities_kind_valid",
            sql`${table.kind} in ('contratante', 'contratista')`,
        ),
    ],
);

export type WatchlistRow = typeof watchlists.$inferSelect;
export type NewWatchlistRow = typeof watchlists.$inferInsert;
export type WatchlistEntityRow = typeof watchlistEntities.$inferSelect;
export type NewWatchlistEntityRow = typeof watchlistEntities.$inferInsert;
