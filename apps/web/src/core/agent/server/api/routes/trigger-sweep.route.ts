import { Elysia } from "elysia";
import { z } from "zod";
import { triggerSweepService } from "@/core/agent/server/services/trigger-sweep-service";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";

export const triggerSweepRoute = new Elysia().use(authed).post(
    "/sweep",
    async ({ user, status }) => {
        const result = await triggerSweepService(user.id);
        if (!result.ok)
            return status(
                result.error.status as 400 | 500,
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
            200: successResponseSchema(
                z.object({
                    enqueued: z.number().int().nonnegative(),
                    detected: z.number().int().nonnegative(),
                    targets: z.number().int().nonnegative(),
                }),
                "SweepResult",
            ),
            400: errorResponseSchema(400),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Agent"],
            summary: "Trigger a manual sweep for the signed-in user's agent",
        },
    },
);
