import "server-only";
import type { Project } from "@/core/project/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findProjectById } from "../repository/find-project-by-id";
import { toProject } from "../repository/utils";

export async function getProjectService(
    userId: string,
    id: string,
): AsyncAppResult<Project> {
    try {
        const row = await findProjectById(id, userId);
        if (!row) return err(AppErrors.notFound({ targets: ["id"] }));
        return ok(toProject(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
