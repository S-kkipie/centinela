import "server-only";
import { and, asc, count, desc, eq, ilike, inArray } from "drizzle-orm";
import type { ProjectSearch } from "@/core/project/domain/types";
import { db } from "@/server/drizzle/db";
import {
    type ProjectRow,
    projects,
} from "@/server/drizzle/schemas/project-schema";

const SORT_COLUMNS = {
    name: projects.name,
    status: projects.status,
    createdAt: projects.createdAt,
    updatedAt: projects.updatedAt,
} as const;

export async function findProjectsPage(
    userId: string,
    params: ProjectSearch,
): Promise<{ rows: ProjectRow[]; total: number }> {
    const { page, perPage, sort, status, name } = params;

    const where = and(
        eq(projects.userId, userId),
        status.length > 0 ? inArray(projects.status, status) : undefined,
        name ? ilike(projects.name, `%${name}%`) : undefined,
    );

    const orderBy = sort.length
        ? sort.map((item) => (item.desc ? desc : asc)(SORT_COLUMNS[item.id]))
        : [desc(projects.createdAt)];

    const rows = await db
        .select()
        .from(projects)
        .where(where)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((page - 1) * perPage);

    const [{ count: total }] = await db
        .select({ count: count() })
        .from(projects)
        .where(where);

    return { rows, total: Number(total) };
}
