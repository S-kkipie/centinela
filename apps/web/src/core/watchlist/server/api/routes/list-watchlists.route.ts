import { Elysia } from "elysia";
import { z } from "zod";
import { watchlistSchema } from "@/core/watchlist/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { listWatchlistsService } from "../../services/list-watchlists-service";

export const listWatchlistsRoute = new Elysia().use(authed).get(
    "/",
    async ({ user, status }) => {
        const result = await listWatchlistsService(user.id);
        if (!result.ok)
            return status(
                result.error.status as 500,
                errorToResponse(result.error),
            );
        return status(
            200,
            CommonResponse.successful({ response: result.data }),
        );
    },
    {
        authed: true,
        response: {
            200: successResponseSchema(z.array(watchlistSchema), "Watchlists"),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Watchlists"],
            summary: "List the current user's watchlists",
        },
    },
);
