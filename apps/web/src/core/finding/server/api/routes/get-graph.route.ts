import { Elysia } from "elysia";
import { z } from "zod";
import { graphSchema } from "@/core/finding/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { getGraphService } from "../../services/get-graph-service";

export const getGraphRoute = new Elysia().use(authed).get(
    "/",
    async ({ user, query, status }) => {
        const result = await getGraphService(user.id, query.watchlistId);
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
        query: z.object({ watchlistId: z.string().min(1) }),
        response: {
            200: successResponseSchema(graphSchema, "Graph"),
            400: errorResponseSchema(400),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Findings"],
            summary: "Contractor-network graph edges for a watchlist",
        },
    },
);
