import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    type ProjectRow,
    projects,
} from "@/server/drizzle/schemas/project-schema";

export async function findProjectById(
    id: string,
    userId: string,
): Promise<ProjectRow | null> {
    const [row] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .limit(1);
    return row ?? null;
}
