import { Elysia } from "elysia";
import {
    createWatchlistSchema,
    watchlistSchema,
} from "@/core/watchlist/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    createdResponseSchema,
    errorResponseSchema,
    errorToResponse,
} from "@/server/common/responses";
import { createWatchlistService } from "../../services/create-watchlist-service";

export const createWatchlistRoute = new Elysia().use(authed).post(
    "/",
    async ({ user, body, status }) => {
        const result = await createWatchlistService(user.id, body);
        if (!result.ok)
            return status(
                result.error.status as 500,
                errorToResponse(result.error),
            );
        return status(201, CommonResponse.created({ response: result.data }));
    },
    {
        authed: true,
        body: createWatchlistSchema,
        response: {
            201: createdResponseSchema(watchlistSchema, "Watchlist"),
            400: errorResponseSchema(400),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Watchlists"], summary: "Create a watchlist" },
    },
);
