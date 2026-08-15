import "server-only";
import type { ProjectStatus } from "@/core/project/domain/types";
import { db } from "@/server/drizzle/db";
import {
    type ProjectRow,
    projects,
} from "@/server/drizzle/schemas/project-schema";

export async function createProject(values: {
    userId: string;
    name: string;
    description?: string | null;
    status?: ProjectStatus;
}): Promise<ProjectRow> {
    const [row] = await db.insert(projects).values(values).returning();
    return row;
}
