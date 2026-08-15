import type {
    FindingEvidence,
    FindingKind,
} from "@centinela/contracts/finding";
import { sql } from "drizzle-orm";
import {
    check,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";
import { watchlists } from "./watchlist-schema";

export const findingKind = pgEnum("finding_kind", [
    "OPORTUNIDAD",
    "BANDERA_ROJA",
]);

/**
 * A scored, cited investigation result the agent emits per tender. Persisted via
 * the machine-to-machine ingest (`POST /api/agent/findings`). Idempotent on
 * `(watchlist_id, tender_id)` so re-sweeps update rather than duplicate.
 */
export const findings = pgTable(
    "findings",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        watchlistId: text("watchlist_id")
            .notNull()
            .references(() => watchlists.id, { onDelete: "cascade" }),
        tenderId: text("tender_id").notNull(),
        entityId: text("entity_id").notNull(),
        entityName: text("entity_name").notNull(),
        kind: findingKind("kind").notNull(),
        score: integer("score").notNull(),
        title: text("title").notNull(),
        summary: text("summary").notNull(),
        evidence: jsonb("evidence").$type<FindingEvidence[]>().notNull(),
        raw: jsonb("raw"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("findings_watchlist_id_idx").on(table.watchlistId),
        index("findings_kind_idx").on(table.kind),
        index("findings_created_at_idx").on(table.createdAt),
        unique("findings_watchlist_tender_uq").on(
            table.watchlistId,
            table.tenderId,
        ),
        check(
            "findings_score_range",
            sql`${table.score} >= 0 AND ${table.score} <= 100`,
        ),
    ],
);

/**
 * Edges of the contractor-relationship graph (who wins with whom, shared legal
 * reps). `fromNit`/`toNit` are NITs/document ids (per contract), so nodes dedupe
 * cleanly across findings. Linked to the finding that surfaced the edge.
 */
export const graphEdges = pgTable(
    "graph_edges",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        watchlistId: text("watchlist_id")
            .notNull()
            .references(() => watchlists.id, { onDelete: "cascade" }),
        findingId: text("finding_id").references(() => findings.id, {
            onDelete: "set null",
        }),
        fromNit: text("from_nit").notNull(),
        toNit: text("to_nit").notNull(),
        relation: text("relation").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("graph_edges_watchlist_id_idx").on(table.watchlistId),
        index("graph_edges_finding_id_idx").on(table.findingId),
    ],
);

export type FindingRow = typeof findings.$inferSelect;
export type NewFindingRow = typeof findings.$inferInsert;
export type GraphEdgeRow = typeof graphEdges.$inferSelect;
export type NewGraphEdgeRow = typeof graphEdges.$inferInsert;
export type { FindingKind };
