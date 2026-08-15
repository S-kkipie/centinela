import { Elysia } from "elysia";
import { z } from "zod";
import { watchlistWithEntitiesSchema } from "@/core/watchlist/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { getWatchlistService } from "../../services/get-watchlist-service";

export const getWatchlistRoute = new Elysia().use(authed).get(
    "/:id",
    async ({ user, params, status }) => {
        const result = await getWatchlistService(user.id, params.id);
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
                watchlistWithEntitiesSchema,
                "WatchlistWithEntities",
            ),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Watchlists"],
            summary: "Get a watchlist with its watched entities",
        },
    },
);
