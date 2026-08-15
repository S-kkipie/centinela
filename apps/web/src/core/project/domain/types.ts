import type { z } from "zod";
import type {
    createProjectSchema,
    paginatedProjectsSchema,
    projectSchema,
    projectSearchSchema,
    projectSortItemSchema,
    projectStatusSchema,
    updateProjectSchema,
} from "./schemas";

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type ProjectSort = z.infer<typeof projectSortItemSchema>;
export type ProjectSearch = z.infer<typeof projectSearchSchema>;
export type PaginatedProjects = z.infer<typeof paginatedProjectsSchema>;
