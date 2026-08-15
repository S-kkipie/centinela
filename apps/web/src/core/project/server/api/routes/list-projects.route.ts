import { Elysia } from "elysia";
import {
    paginatedProjectsSchema,
    projectSearchSchema,
} from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { searchProjectsService } from "../../services/search-projects-service";

export const listProjectsRoute = new Elysia().use(authed).get(
    "/",
    async ({ user, query, status }) => {
        const result = await searchProjectsService(user.id, query);
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
        query: projectSearchSchema,
        response: {
            200: successResponseSchema(
                paginatedProjectsSchema,
                "PaginatedProjects",
            ),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Projects"],
            summary: "Search the current user's projects",
            description:
                "Returns one filtered, paginated, sortable page of the current user's projects.",
        },
    },
);
