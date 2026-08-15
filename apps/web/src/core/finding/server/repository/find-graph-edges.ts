import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    type GraphEdgeRow,
    graphEdges,
} from "@/server/drizzle/schemas/finding-schema";
import { watchlists } from "@/server/drizzle/schemas/watchlist-schema";

/** Contractor-graph edges for a watchlist the user owns. */
export async function findGraphEdges(
    userId: string,
    watchlistId: string,
): Promise<GraphEdgeRow[]> {
    const rows = await db
        .select()
        .from(graphEdges)
        .innerJoin(watchlists, eq(graphEdges.watchlistId, watchlists.id))
        .where(
            and(
                eq(watchlists.userId, userId),
                eq(graphEdges.watchlistId, watchlistId),
            ),
        );
    return rows.map((r) => r.graph_edges);
}
