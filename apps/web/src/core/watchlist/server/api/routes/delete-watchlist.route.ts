import { Elysia } from "elysia";
import { z } from "zod";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { deleteWatchlistService } from "../../services/delete-watchlist-service";

export const deleteWatchlistRoute = new Elysia().use(authed).delete(
    "/:id",
    async ({ user, params, status }) => {
        const result = await deleteWatchlistService(user.id, params.id);
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
                "DeleteWatchlist",
            ),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Watchlists"], summary: "Delete a watchlist" },
    },
);
