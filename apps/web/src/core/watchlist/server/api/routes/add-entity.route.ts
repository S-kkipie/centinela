import { Elysia } from "elysia";
import { z } from "zod";
import {
    addWatchlistEntitySchema,
    watchlistEntitySchema,
} from "@/core/watchlist/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    createdResponseSchema,
    errorResponseSchema,
    errorToResponse,
} from "@/server/common/responses";
import { addEntityService } from "../../services/add-entity-service";

export const addEntityRoute = new Elysia().use(authed).post(
    "/:id/entities",
    async ({ user, params, body, status }) => {
        const result = await addEntityService(user.id, params.id, body);
        if (!result.ok)
            return status(
                result.error.status as 404 | 500,
                errorToResponse(result.error),
            );
        return status(201, CommonResponse.created({ response: result.data }));
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        body: addWatchlistEntitySchema,
        response: {
            201: createdResponseSchema(
                watchlistEntitySchema,
                "WatchlistEntity",
            ),
            400: errorResponseSchema(400),
            404: errorResponseSchema(404),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Watchlists"],
            summary: "Add a watched entity to a watchlist",
        },
    },
);
