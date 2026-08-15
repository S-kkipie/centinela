import { Elysia } from "elysia";
import { z } from "zod";
import {
    updateWatchlistSchema,
    watchlistSchema,
} from "@/core/watchlist/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { updateWatchlistService } from "../../services/update-watchlist-service";

export const updateWatchlistRoute = new Elysia().use(authed).patch(
    "/:id",
    async ({ user, params, body, status }) => {
        const result = await updateWatchlistService(user.id, params.id, body);
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
        body: updateWatchlistSchema,
        response: {
            200: successResponseSchema(watchlistSchema, "Watchlist"),
            400: errorResponseSchema(400),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Watchlists"], summary: "Update a watchlist" },
    },
);
