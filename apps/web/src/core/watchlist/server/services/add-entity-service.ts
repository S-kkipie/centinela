import "server-only";
import type {
    AddWatchlistEntity,
    WatchlistEntity,
} from "@/core/watchlist/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { addWatchlistEntity } from "../repository/entities";
import { findWatchlistById } from "../repository/find-watchlist-by-id";
import { toWatchlistEntity } from "../repository/utils";
import { syncAgentForUser } from "../sync-agent";

export async function addEntityService(
    userId: string,
    watchlistId: string,
    input: AddWatchlistEntity,
): AsyncAppResult<WatchlistEntity> {
    try {
        const watchlist = await findWatchlistById(userId, watchlistId);
        if (!watchlist)
            return err(AppErrors.notFound({ targets: ["watchlist"] }));
        const row = await addWatchlistEntity(watchlistId, input);
        // Push the user's new target set to the agent (best-effort, never throws).
        await syncAgentForUser(userId);
        return ok(toWatchlistEntity(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
