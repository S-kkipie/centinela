import { Elysia } from "elysia";
import {
    createProjectSchema,
    projectSchema,
} from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    createdResponseSchema,
    errorResponseSchema,
    errorToResponse,
} from "@/server/common/responses";
import { createProjectService } from "../../services/create-project-service";

export const createProjectRoute = new Elysia().use(authed).post(
    "/",
    async ({ user, body, status }) => {
        const result = await createProjectService(user.id, body);
        if (!result.ok)
            return status(
                result.error.status as 500,
                errorToResponse(result.error),
            );
        return status(201, CommonResponse.created({ response: result.data }));
    },
    {
        authed: true,
        body: createProjectSchema,
        response: {
            201: createdResponseSchema(projectSchema, "Project"),
            400: errorResponseSchema(400),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Create a project" },
    },
);
