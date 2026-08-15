import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const projectStatus = pgEnum("project_status", ["active", "archived"]);

/**
 * The starter's reference CRUD model. Owned by a user; deletion cascades so a
 * user's projects vanish with them. Clone this file's shape for a new domain.
 */
export const projects = pgTable(
    "projects",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        description: text("description"),
        status: projectStatus("status").default("active").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("projects_user_id_idx").on(table.userId),
        index("projects_status_idx").on(table.status),
        check("projects_name_not_empty", sql`length(trim(${table.name})) > 0`),
    ],
);

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
