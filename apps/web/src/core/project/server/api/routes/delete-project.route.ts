import { Elysia } from "elysia";
import { z } from "zod";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { deleteProjectService } from "../../services/delete-project-service";

export const deleteProjectRoute = new Elysia().use(authed).delete(
    "/:id",
    async ({ user, params, status }) => {
        const result = await deleteProjectService(user.id, params.id);
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
            200: successResponseSchema(
                z.object({ id: z.string() }),
                "DeleteProject",
            ),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Projects"], summary: "Delete a project by id" },
    },
);
