import "server-only";
import type { CreateWatchlist, Watchlist } from "@/core/watchlist/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { createWatchlist } from "../repository/create-watchlist";
import { toWatchlist } from "../repository/utils";

export async function createWatchlistService(
    userId: string,
    input: CreateWatchlist,
): AsyncAppResult<Watchlist> {
    try {
        const row = await createWatchlist({ userId, ...input });
        return ok(toWatchlist(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
