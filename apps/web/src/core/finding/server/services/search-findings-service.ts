import "server-only";
import type {
    FindingSearch,
    PaginatedFindings,
} from "@/core/finding/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findFindingsPage } from "../repository/find-findings-page";
import { toFinding } from "../repository/utils";

export async function searchFindingsService(
    userId: string,
    params: FindingSearch,
): AsyncAppResult<PaginatedFindings> {
    try {
        const { rows, total } = await findFindingsPage(userId, params);
        return ok({
            items: rows.map(toFinding),
            total,
            page: params.page,
            perPage: params.perPage,
            pageCount: Math.ceil(total / params.perPage),
        });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
