import type { Project } from "@/core/project/domain/types";
import type { ProjectRow } from "@/server/drizzle/schemas/project-schema";

/** Convert a DB row (Date timestamps) into the wire shape (ISO strings). */
export function toProject(row: ProjectRow): Project {
    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
