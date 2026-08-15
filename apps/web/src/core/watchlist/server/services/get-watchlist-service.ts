import "server-only";
import type { WatchlistWithEntities } from "@/core/watchlist/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import {
    findWatchlistById,
    findWatchlistEntities,
} from "../repository/find-watchlist-by-id";
import { toWatchlist, toWatchlistEntity } from "../repository/utils";

export async function getWatchlistService(
    userId: string,
    id: string,
): AsyncAppResult<WatchlistWithEntities> {
    try {
        const row = await findWatchlistById(userId, id);
        if (!row) return err(AppErrors.notFound({ targets: ["watchlist"] }));
        const entities = await findWatchlistEntities(row.id);
        return ok({
            ...toWatchlist(row),
            entities: entities.map(toWatchlistEntity),
        });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
