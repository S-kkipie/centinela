import "server-only";
import type { Watchlist } from "@/core/watchlist/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findWatchlists } from "../repository/find-watchlists";
import { toWatchlist } from "../repository/utils";

export async function listWatchlistsService(
    userId: string,
): AsyncAppResult<Watchlist[]> {
    try {
        const rows = await findWatchlists(userId);
        return ok(rows.map(toWatchlist));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
