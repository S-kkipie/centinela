import { z } from "zod";

import { projectStatusSchema } from "@/core/project/domain/schemas";

/**
 * Client-side form schema for the project create/edit form. Every key is
 * required because the form is seeded with concrete `defaultValues`; here
 * `description` allows an empty string. The create/update modals map an empty
 * description to `undefined` (create) / `null` (edit) before calling the
 * mutation, matching each server schema.
 */
export const projectFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required.")
        .max(200, "Name must be 200 characters or fewer."),
    description: z
        .string()
        .max(2000, "Description must be 2000 characters or fewer."),
    status: projectStatusSchema,
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
