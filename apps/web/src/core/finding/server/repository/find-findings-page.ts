import "server-only";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { FindingSearch } from "@/core/finding/domain/types";
import { db } from "@/server/drizzle/db";
import {
    type FindingRow,
    findings,
} from "@/server/drizzle/schemas/finding-schema";
import { watchlists } from "@/server/drizzle/schemas/watchlist-schema";

const SORT_COLUMNS = {
    score: findings.score,
    createdAt: findings.createdAt,
} as const;

/**
 * A page of findings across a user's watchlists. Joined to `watchlists` so a
 * user only ever sees findings they own. Optional watchlist and kind filters.
 */
export async function findFindingsPage(
    userId: string,
    params: FindingSearch,
): Promise<{ rows: FindingRow[]; total: number }> {
    const { page, perPage, sort, kind, watchlistId } = params;

    const where = and(
        eq(watchlists.userId, userId),
        watchlistId ? eq(findings.watchlistId, watchlistId) : undefined,
        kind.length > 0 ? inArray(findings.kind, kind) : undefined,
    );

    const orderBy = sort.length
        ? sort.map((item) => (item.desc ? desc : asc)(SORT_COLUMNS[item.id]))
        : [desc(findings.createdAt)];

    const rows = await db
        .select()
        .from(findings)
        .innerJoin(watchlists, eq(findings.watchlistId, watchlists.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((page - 1) * perPage);

    const [{ count: total }] = await db
        .select({ count: count() })
        .from(findings)
        .innerJoin(watchlists, eq(findings.watchlistId, watchlists.id))
        .where(where);

    return { rows: rows.map((r) => r.findings), total: Number(total) };
}
