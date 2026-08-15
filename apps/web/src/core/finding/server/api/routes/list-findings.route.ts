import { Elysia } from "elysia";
import {
    findingSearchSchema,
    paginatedFindingsSchema,
} from "@/core/finding/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { searchFindingsService } from "../../services/search-findings-service";

export const listFindingsRoute = new Elysia().use(authed).get(
    "/",
    async ({ user, query, status }) => {
        const result = await searchFindingsService(user.id, query);
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
        query: findingSearchSchema,
        response: {
            200: successResponseSchema(
                paginatedFindingsSchema,
                "PaginatedFindings",
            ),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Findings"],
            summary: "The current user's findings feed",
            description:
                "One filtered, paginated page of findings across the user's watchlists.",
        },
    },
);
