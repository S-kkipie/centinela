import "server-only";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { deleteWatchlist } from "../repository/delete-watchlist";

export async function deleteWatchlistService(
    userId: string,
    id: string,
): AsyncAppResult<{ id: string }> {
    try {
        const deleted = await deleteWatchlist(userId, id);
        if (!deleted)
            return err(AppErrors.notFound({ targets: ["watchlist"] }));
        return ok(deleted);
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
