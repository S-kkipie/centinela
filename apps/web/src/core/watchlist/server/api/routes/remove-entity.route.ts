import { Elysia } from "elysia";
import { z } from "zod";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { removeEntityService } from "../../services/remove-entity-service";

export const removeEntityRoute = new Elysia().use(authed).delete(
    "/:id/entities/:entityId",
    async ({ user, params, status }) => {
        const result = await removeEntityService(
            user.id,
            params.id,
            params.entityId,
        );
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
        params: z.object({ id: z.string(), entityId: z.string() }),
        response: {
            200: successResponseSchema(
                z.object({ id: z.string() }),
                "RemoveWatchlistEntity",
            ),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Watchlists"],
            summary: "Remove a watched entity from a watchlist",
        },
    },
);
