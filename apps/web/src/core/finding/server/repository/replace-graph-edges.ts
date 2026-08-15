import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    graphEdges,
    type NewGraphEdgeRow,
} from "@/server/drizzle/schemas/finding-schema";

/**
 * Replace a finding's graph edges: clear stale ones from a prior sweep, then
 * insert the current set. Keeps the contractor graph in sync on re-ingest.
 */
export async function replaceGraphEdges(
    findingId: string,
    edges: Omit<NewGraphEdgeRow, "id" | "createdAt">[],
): Promise<void> {
    await db.delete(graphEdges).where(eq(graphEdges.findingId, findingId));
    if (edges.length > 0) {
        await db.insert(graphEdges).values(edges);
    }
}
