import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createCromaClient } from "../src/client.ts";
import { CromaNotFoundError } from "../src/errors.ts";
import type { Transport } from "../src/http.ts";

const fixture = (id: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/${id}.json`, import.meta.url), "utf8")).data;

/** Stub transport that answers by path and records calls. */
function stubTransport(byPath: Record<string, unknown>): {
  transport: Transport;
  calls: Array<{ path: string; body: Record<string, unknown> }>;
} {
  const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
  const transport: Transport = {
    request: vi.fn(async (path: string, body: Record<string, unknown>) => {
      calls.push({ path, body });
      if (!(path in byPath)) throw new Error(`no stub for ${path}`);
      const answer = byPath[path];
      if (answer instanceof Error) throw answer;
      return answer;
    }),
  };
  return { transport, calls };
}

describe("createCromaClient — endpoint wiring", () => {
  it("calls each Croma path with the right body and maps the response", async () => {
    const { transport, calls } = stubTransport({
      "/co/secop/processes-by-entity/v1": fixture("secop-processes-by-entity"),
      "/co/secop/process/v1": fixture("secop-process"),
      "/co/secop/contracts-by-provider/v1": fixture("secop-contracts-by-provider"),
      "/co/secop/sanctions-by-provider/v1": fixture("secop-sanctions-by-provider"),
      "/co/rues/entity-by-nit/v1": fixture("rues-entity-by-nit"),
      "/co/supersociedades/financial-statements/v1": fixture("supersociedades-financial-statements"),
      "/co/rama-judicial/cases-by-entity/v1": fixture("rama-judicial-cases-by-entity"),
      "/co/procuraduria/disciplinary-records/v1": fixture("procuraduria-disciplinary-records"),
      "/co/contraloria/fiscal-records/v1": fixture("contraloria-fiscal-records"),
    });
    const client = createCromaClient({ apiKey: "k", transport });

    const tenders = await client.secopProcessesByEntity("899999061");
    expect(tenders[0].noticeUid).toBe("CO1.NTC.10701223");

    await client.secopProcessByNotice("CO1.NTC.9458505");
    await client.secopContractsByProvider("79372917");
    await client.secopSanctionsByProvider("1067811412");
    const company = await client.ruesEntityByNit("900654922");
    expect(company?.nit).toBe("900654922");
    await client.supersociedadesFinancials("900249127");
    await client.ramaJudicialCasesByEntity("PEDRO CIFUENTES");
    await client.procuraduriaRecords("1234567890");
    await client.contraloriaRecords("1234567890");

    expect(calls).toEqual([
      { path: "/co/secop/processes-by-entity/v1", body: { document_number: "899999061" } },
      { path: "/co/secop/process/v1", body: { notice_uid: "CO1.NTC.9458505" } },
      { path: "/co/secop/contracts-by-provider/v1", body: { document_number: "79372917" } },
      { path: "/co/secop/sanctions-by-provider/v1", body: { document_number: "1067811412" } },
      { path: "/co/rues/entity-by-nit/v1", body: { document_number: "900654922" } },
      { path: "/co/supersociedades/financial-statements/v1", body: { document_number: "900249127" } },
      { path: "/co/rama-judicial/cases-by-entity/v1", body: { name: "PEDRO CIFUENTES" } },
      { path: "/co/procuraduria/disciplinary-records/v1", body: { document_number: "1234567890" } },
      { path: "/co/contraloria/fiscal-records/v1", body: { document_number: "1234567890" } },
    ]);
  });

  it("passes the sweep window and page into the SECOP body", async () => {
    const { transport, calls } = stubTransport({
      "/co/secop/processes-by-entity/v1": { processes: [] },
    });
    const client = createCromaClient({ apiKey: "k", transport });

    await client.secopProcessesByEntity("899999061", { from: "2026-01-01", to: "2026-08-01", page: 2 });

    expect(calls[0].body).toEqual({
      document_number: "899999061",
      from_date: "2026-01-01",
      to_date: "2026-08-01",
      page: 2,
    });
  });

  it("maps a not-found notice to null instead of throwing", async () => {
    const notFound = new CromaNotFoundError("gone", { status: 404, endpoint: "/co/secop/process/v1" });
    const { transport } = stubTransport({ "/co/secop/process/v1": notFound });
    const client = createCromaClient({ apiKey: "k", transport });

    await expect(client.secopProcessByNotice("CO1.NTC.X")).resolves.toBeNull();
  });

  it("maps a not-found list endpoint to an empty array", async () => {
    const notFound = new CromaNotFoundError("gone", {
      status: 404,
      endpoint: "/co/secop/contracts-by-provider/v1",
    });
    const { transport } = stubTransport({ "/co/secop/contracts-by-provider/v1": notFound });
    const client = createCromaClient({ apiKey: "k", transport });

    await expect(client.secopContractsByProvider("000")).resolves.toEqual([]);
  });
});

describe("createCromaClient — default transport", () => {
  it("POSTs to https://api.croma.run with Bearer auth", async () => {
    let captured: { url: string | URL | Request; init?: RequestInit } | undefined;
    const fetchImpl = (async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ data: { processes: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const client = createCromaClient({ apiKey: "croma_live_K", fetchImpl });

    await client.secopProcessesByEntity("899999061");

    expect(captured?.url).toBe("https://api.croma.run/co/secop/processes-by-entity/v1");
    expect(new Headers(captured?.init?.headers).get("authorization")).toBe("Bearer croma_live_K");
  });
});
