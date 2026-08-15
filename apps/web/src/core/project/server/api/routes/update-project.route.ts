import { Elysia } from "elysia";
import { z } from "zod";
import {
    projectSchema,
    updateProjectSchema,
} from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { updateProjectService } from "../../services/update-project-service";

export const updateProjectRoute = new Elysia().use(authed).put(
    "/:id",
    async ({ user, params, body, status }) => {
        const result = await updateProjectService(user.id, params.id, body);
        if (!result.ok)
            return status(
                result.error.status as 400 | 404 | 500,
                errorToResponse(result.error),
            );
        return status(
            200,
            CommonResponse.successful({ response: result.data }),
        );
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        body: updateProjectSchema,
        response: {
            200: successResponseSchema(projectSchema, "Project"),
            400: errorResponseSchema(400),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Update a project by id" },
    },
);
