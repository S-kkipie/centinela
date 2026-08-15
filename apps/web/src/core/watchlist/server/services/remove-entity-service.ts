import "server-only";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { removeWatchlistEntity } from "../repository/entities";
import { findWatchlistById } from "../repository/find-watchlist-by-id";

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
        return ok(removed);
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
