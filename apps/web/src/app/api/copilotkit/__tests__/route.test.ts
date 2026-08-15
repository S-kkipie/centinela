import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/auth", () => ({
    authenticate: vi.fn(),
}));

// Never boot the real CopilotKit runtime (Gemini) in unit tests.
vi.mock("../runtime", () => ({
    handleCopilotRequest: vi.fn(async () => Response.json({ ok: true })),
}));

import { authenticate } from "@/server/auth/auth";
import { POST } from "../route";
import { handleCopilotRequest } from "../runtime";

const req = () =>
    new Request("http://localhost/api/copilotkit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hello: "world" }),
    });

describe("POST /api/copilotkit", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns 401 and never touches the runtime when unauthenticated", async () => {
        vi.mocked(authenticate).mockResolvedValue(null);
        const res = await POST(req());
        expect(res.status).toBe(401);
        expect(handleCopilotRequest).not.toHaveBeenCalled();
    });

    it("delegates to the copilot runtime when authenticated", async () => {
        vi.mocked(authenticate).mockResolvedValue({
            // biome-ignore lint/suspicious/noExplicitAny: minimal session stub
            user: { id: "u1" } as any,
            // biome-ignore lint/suspicious/noExplicitAny: minimal session stub
            session: { id: "s1" } as any,
        });
        const res = await POST(req());
        expect(res.status).toBe(200);
        expect(handleCopilotRequest).toHaveBeenCalledTimes(1);
    });
});
