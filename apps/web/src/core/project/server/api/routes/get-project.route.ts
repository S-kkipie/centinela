import { Elysia } from "elysia";
import { z } from "zod";
import { projectSchema } from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { getProjectService } from "../../services/get-project-service";

export const getProjectRoute = new Elysia().use(authed).get(
    "/:id",
    async ({ user, params, status }) => {
        const result = await getProjectService(user.id, params.id);
        if (!result.ok)
            return status(
                result.error.status as 404 | 500,
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
        response: {
            200: successResponseSchema(projectSchema, "Project"),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Get a project by id" },
    },
);
