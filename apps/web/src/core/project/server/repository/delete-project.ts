import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { projects } from "@/server/drizzle/schemas/project-schema";

export async function deleteProject(
    id: string,
    userId: string,
): Promise<{ id: string } | null> {
    const [row] = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning({ id: projects.id });
    return row ?? null;
}
