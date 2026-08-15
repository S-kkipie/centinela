import "server-only";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { deleteProject } from "../repository/delete-project";

export async function deleteProjectService(
    userId: string,
    id: string,
): AsyncAppResult<{ id: string }> {
    try {
        const row = await deleteProject(id, userId);
        if (!row) return err(AppErrors.notFound({ targets: ["id"] }));
        return ok(row);
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
