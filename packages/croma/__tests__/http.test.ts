import { describe, expect, it, vi } from "vitest";
import { CromaAuthError, CromaError, CromaNotFoundError, CromaRateLimitError } from "../src/errors.ts";
import { createTransport } from "../src/http.ts";

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/** A fetch stub that returns queued responses (or throws queued errors) in order. */
function stubFetch(queue: Array<Response | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (next === undefined) throw new Error("stubFetch: no more queued responses");
    if (next instanceof Error) throw next;
    return next;
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}

const base = {
  baseUrl: "https://api.croma.run",
  apiKey: "croma_live_TEST",
  sleep: async () => {},
};

describe("createTransport.request", () => {
  it("POSTs with Bearer auth + JSON body and unwraps the data envelope", async () => {
    const { fetchImpl, calls } = stubFetch([
      jsonResponse(200, { data: { count: 2, processes: [] } }),
    ]);
    const transport = createTransport({ ...base, fetchImpl });

    const data = await transport.request("/co/secop/processes-by-entity/v1", {
      document_number: "899999061",
    });

    expect(data).toEqual({ count: 2, processes: [] });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.croma.run/co/secop/processes-by-entity/v1");
    expect(calls[0].init.method).toBe("POST");
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get("authorization")).toBe("Bearer croma_live_TEST");
    expect(headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ document_number: "899999061" });
  });

  it("throws CromaAuthError on 401 without retrying", async () => {
    const { fetchImpl, calls } = stubFetch([
      jsonResponse(401, { error: { code: "unauthorized", message: "bad key" } }),
    ]);
    const transport = createTransport({ ...base, fetchImpl });

    await expect(transport.request("/x", {})).rejects.toBeInstanceOf(CromaAuthError);
    expect(calls).toHaveLength(1);
  });

  it("throws CromaNotFoundError on 404", async () => {
    const { fetchImpl } = stubFetch([jsonResponse(404, { error: { code: "not_found" } })]);
    const transport = createTransport({ ...base, fetchImpl });
    await expect(transport.request("/x", {})).rejects.toBeInstanceOf(CromaNotFoundError);
  });

  it("retries a 429 honoring Retry-After, then succeeds", async () => {
    const slept: number[] = [];
    const { fetchImpl, calls } = stubFetch([
      jsonResponse(429, { error: { message: "slow" } }, { "retry-after": "3" }),
      jsonResponse(200, { data: { ok: true } }),
    ]);
    const transport = createTransport({
      ...base,
      fetchImpl,
      sleep: async (ms) => {
        slept.push(ms);
      },
    });

    const data = await transport.request("/x", {});

    expect(data).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    expect(slept).toEqual([3000]);
  });

  it("retries 5xx with backoff then throws after maxRetries", async () => {
    const slept: number[] = [];
    const { fetchImpl, calls } = stubFetch([
      jsonResponse(500, { error: { code: "server_error" } }),
      jsonResponse(500, { error: { code: "server_error" } }),
      jsonResponse(500, { error: { code: "server_error" } }),
    ]);
    const transport = createTransport({
      ...base,
      fetchImpl,
      maxRetries: 2,
      backoffBaseMs: 100,
      sleep: async (ms) => {
        slept.push(ms);
      },
    });

    await expect(transport.request("/x", {})).rejects.toBeInstanceOf(CromaError);
    // 1 initial + 2 retries = 3 attempts; 2 sleeps with exponential backoff.
    expect(calls).toHaveLength(3);
    expect(slept).toEqual([100, 200]);
  });

  it("retries a thrown network error then rethrows as CromaError", async () => {
    const { fetchImpl, calls } = stubFetch([
      new TypeError("network down"),
      new TypeError("network down"),
    ]);
    const transport = createTransport({ ...base, fetchImpl, maxRetries: 1 });

    const err = await transport.request("/x", {}).catch((e) => e);
    expect(err).toBeInstanceOf(CromaError);
    expect(calls).toHaveLength(2);
  });

  it("acquires a rate-limiter token before each attempt", async () => {
    const acquire = vi.fn(async () => {});
    const { fetchImpl } = stubFetch([jsonResponse(200, { data: {} })]);
    const transport = createTransport({ ...base, fetchImpl, limiter: { acquire } });

    await transport.request("/x", {});
    expect(acquire).toHaveBeenCalledTimes(1);
  });
});
