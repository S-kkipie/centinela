import "server-only";
import type { UpdateWatchlist, Watchlist } from "@/core/watchlist/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { updateWatchlist } from "../repository/update-watchlist";
import { toWatchlist } from "../repository/utils";

export async function updateWatchlistService(
    userId: string,
    id: string,
    input: UpdateWatchlist,
): AsyncAppResult<Watchlist> {
    try {
        const row = await updateWatchlist(userId, id, input);
        if (!row) return err(AppErrors.notFound({ targets: ["watchlist"] }));
        return ok(toWatchlist(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
