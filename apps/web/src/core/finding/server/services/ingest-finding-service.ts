import "server-only";
import type { FindingIngest } from "@centinela/contracts/finding";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findWatchlistIdsByEntityNit } from "../repository/find-watchlist-ids-by-entity";
import { replaceGraphEdges } from "../repository/replace-graph-edges";
import { upsertFinding } from "../repository/upsert-finding";

/**
 * Persist an agent finding. Resolves which watchlist(s) watch the finding's
 * entity (by NIT), upserts the finding into each, and syncs its graph edges.
 * When no watchlist watches the entity the call is a no-op (the agent may sweep
 * ahead of any watchlist).
 */
export async function ingestFindingService(
    payload: FindingIngest,
): AsyncAppResult<{ findingsWritten: number }> {
    try {
        const watchlistIds = await findWatchlistIdsByEntityNit(
            payload.entityId,
        );
        for (const watchlistId of watchlistIds) {
            const finding = await upsertFinding(watchlistId, payload);
            const edges = payload.graphEdges.map((e) => ({
                watchlistId,
                findingId: finding.id,
                fromNit: e.from,
                toNit: e.to,
                relation: e.relation,
            }));
            await replaceGraphEdges(finding.id, edges);
        }
        return ok({ findingsWritten: watchlistIds.length });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
