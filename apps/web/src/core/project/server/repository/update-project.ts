import "server-only";
import { and, eq } from "drizzle-orm";
import type { UpdateProject } from "@/core/project/domain/types";
import { db } from "@/server/drizzle/db";
import {
    type ProjectRow,
    projects,
} from "@/server/drizzle/schemas/project-schema";
import { findProjectById } from "./find-project-by-id";

export async function updateProject(
    id: string,
    userId: string,
    values: UpdateProject,
): Promise<ProjectRow | null> {
    // Empty patch → no SET clause allowed; just return the current row (or null).
    if (Object.keys(values).length === 0) return findProjectById(id, userId);

    const [row] = await db
        .update(projects)
        .set(values)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();
    return row ?? null;
}
