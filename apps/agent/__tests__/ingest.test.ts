import { describe, expect, it, vi } from "vitest";
import type { FindingIngest } from "@centinela/contracts/finding";
import { ingestFinding } from "../src/ingest.ts";

const finding: FindingIngest = {
  tenderId: "CO1.NTC.777",
  entityId: "899999061",
  entityName: "Alcaldía de Bogotá",
  kind: "BANDERA_ROJA",
  score: 88,
  title: "t",
  summary: "s",
  evidence: [{ source: "rues-entity-by-nit", claim: "c" }],
  graphEdges: [],
};

describe("ingestFinding", () => {
  it("POSTs to /api/agent/findings with the x-agent-key header and JSON body", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 201 }));
    await ingestFinding(
      finding,
      { url: "http://localhost:3000", key: "SECRET" },
      fetchImpl as unknown as typeof fetch,
    );
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/agent/findings");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe("SECRET");
    expect(headers["content-type"]).toBe("application/json");
    expect(JSON.parse((init as RequestInit).body as string).tenderId).toBe("CO1.NTC.777");
  });

  it("trims a trailing slash on the base url", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    await ingestFinding(
      finding,
      { url: "http://localhost:3000/", key: "k" },
      fetchImpl as unknown as typeof fetch,
    );
    expect(String(fetchImpl.mock.calls[0][0])).toBe("http://localhost:3000/api/agent/findings");
  });

  it("throws on a non-2xx response", async () => {
    const fetchImpl = vi.fn(async () => new Response("bad", { status: 401 }));
    await expect(
      ingestFinding(finding, { url: "http://x", key: "k" }, fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});
