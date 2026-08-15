import "server-only";
import type {
    PaginatedProjects,
    ProjectSearch,
} from "@/core/project/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findProjectsPage } from "../repository/find-projects-page";
import { toProject } from "../repository/utils";

export async function searchProjectsService(
    userId: string,
    params: ProjectSearch,
): AsyncAppResult<PaginatedProjects> {
    try {
        const { rows, total } = await findProjectsPage(userId, params);
        const pageCount = Math.ceil(total / params.perPage);
        return ok({
            items: rows.map(toProject),
            total,
            page: params.page,
            perPage: params.perPage,
            pageCount,
        });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
