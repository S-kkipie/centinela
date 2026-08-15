import "server-only";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { removeWatchlistEntity } from "../repository/entities";
import { findWatchlistById } from "../repository/find-watchlist-by-id";
import { syncAgentForUser } from "../sync-agent";

export async function removeEntityService(
    userId: string,
    watchlistId: string,
    entityId: string,
): AsyncAppResult<{ id: string }> {
    try {
        const watchlist = await findWatchlistById(userId, watchlistId);
        if (!watchlist)
            return err(AppErrors.notFound({ targets: ["watchlist"] }));
        const removed = await removeWatchlistEntity(watchlistId, entityId);
        if (!removed) return err(AppErrors.notFound({ targets: ["entity"] }));
        // Replace semantics: the removed NIT drops out of the agent's sweep.
        await syncAgentForUser(userId);
        return ok(removed);
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
