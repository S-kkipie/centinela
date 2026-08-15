import "server-only";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { deleteWatchlist } from "../repository/delete-watchlist";
import { syncAgentForUser } from "../sync-agent";

export async function deleteWatchlistService(
    userId: string,
    id: string,
): AsyncAppResult<{ id: string }> {
    try {
        const deleted = await deleteWatchlist(userId, id);
        if (!deleted)
            return err(AppErrors.notFound({ targets: ["watchlist"] }));
        // Its entities are gone; re-push the user's remaining targets.
        await syncAgentForUser(userId);
        return ok(deleted);
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
