import "server-only";
import { redirect } from "next/navigation";
import { authenticate } from "./auth";

/** Page guard for protected server components. `redirect` throws, so the
 *  return is always a non-null session. */
export async function requireAuth() {
    const session = await authenticate();
    if (!session) redirect("/auth/sign-in");
    return session;
}
