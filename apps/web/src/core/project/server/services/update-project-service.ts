import "server-only";
import type { Project, UpdateProject } from "@/core/project/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { updateProject } from "../repository/update-project";
import { toProject } from "../repository/utils";

export async function updateProjectService(
    userId: string,
    id: string,
    input: UpdateProject,
): AsyncAppResult<Project> {
    try {
        const row = await updateProject(id, userId, input);
        if (!row) return err(AppErrors.notFound({ targets: ["id"] }));
        return ok(toProject(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
