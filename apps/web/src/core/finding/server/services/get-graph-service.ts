import "server-only";
import type { Graph } from "@/core/finding/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findGraphEdges } from "../repository/find-graph-edges";
import { toGraphEdge } from "../repository/utils";

export async function getGraphService(
    userId: string,
    watchlistId: string,
): AsyncAppResult<Graph> {
    try {
        const rows = await findGraphEdges(userId, watchlistId);
        return ok({ edges: rows.map(toGraphEdge) });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
