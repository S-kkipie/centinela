import "server-only";
import type { CreateProject, Project } from "@/core/project/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { createProject } from "../repository/create-project";
import { toProject } from "../repository/utils";

export async function createProjectService(
    userId: string,
    input: CreateProject,
): AsyncAppResult<Project> {
    try {
        const row = await createProject({ userId, ...input });
        return ok(toProject(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
