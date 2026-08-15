import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/finding/server/services/ingest-finding-service", () => ({
    ingestFindingService: vi.fn(),
}));

import type { FindingIngest } from "@centinela/contracts/finding";
import { ingestFindingService } from "@/core/finding/server/services/ingest-finding-service";
import { POST } from "../route";

const KEY = "test-agent-ingest-key-1234567890";

const validBody: FindingIngest = {
    tenderId: "t1",
    entityId: "900123456",
    entityName: "Alcaldía",
    kind: "OPORTUNIDAD",
    score: 42,
    title: "T",
    summary: "S",
    evidence: [{ source: "secop", claim: "c" }],
    graphEdges: [],
};

function req(body: unknown, key?: string): Request {
    return new Request("http://localhost/api/agent/findings", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...(key ? { "x-agent-key": key } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/agent/findings", () => {
    beforeEach(() => vi.clearAllMocks());

    it("rejects a missing agent key with 401", async () => {
        const res = await POST(req(validBody));
        expect(res.status).toBe(401);
        expect(ingestFindingService).not.toHaveBeenCalled();
    });

    it("rejects a wrong agent key with 401", async () => {
        const res = await POST(req(validBody, "nope"));
        expect(res.status).toBe(401);
    });

    it("rejects an invalid body with 400 and error list", async () => {
        const res = await POST(req({ tenderId: "" }, KEY));
        expect(res.status).toBe(400);
        const json = (await res.json()) as { errors: string[] };
        expect(Array.isArray(json.errors)).toBe(true);
        expect(ingestFindingService).not.toHaveBeenCalled();
    });

    it("persists a valid finding and returns 200", async () => {
        vi.mocked(ingestFindingService).mockResolvedValue({
            ok: true,
            data: { findingsWritten: 1 },
        });
        const res = await POST(req(validBody, KEY));
        expect(res.status).toBe(200);
        const json = (await res.json()) as {
            response: { findingsWritten: number };
        };
        expect(json.response.findingsWritten).toBe(1);
        expect(ingestFindingService).toHaveBeenCalledWith(
            expect.objectContaining({ tenderId: "t1" }),
        );
    });

    it("returns 500 when the service fails", async () => {
        vi.mocked(ingestFindingService).mockResolvedValue({
            ok: false,
            error: {
                type: "UnexpectedError",
                code: "INTERNAL_SERVER_ERROR",
                status: 500,
                cause: new Error("x"),
            },
        });
        const res = await POST(req(validBody, KEY));
        expect(res.status).toBe(500);
    });
});
