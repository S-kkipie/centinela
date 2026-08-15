import { Elysia } from "elysia";
import { auth } from "@/server/auth/auth";
import { CommonResponse } from "@/server/common/responses";

/**
 * Resolves the Better Auth session. On a route that sets `authed: true`, injects
 * `user`/`session`; returns a structured 401 when there is no session.
 */
export const authed = new Elysia({ name: "authed" }).macro({
    authed: {
        async resolve({ status, request: { headers } }) {
            const session = await auth.api.getSession({ headers });
            if (!session) return status(401, CommonResponse.unauthorized());
            return { user: session.user, session: session.session };
        },
    },
});
