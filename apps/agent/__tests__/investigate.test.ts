import { describe, expect, it } from "vitest";
import type {
  CompanyRecord,
  CromaClient,
  FinancialRecord,
  JudicialProcess,
  ProviderContract,
  Sanction,
  TenderDetail,
  Tender,
} from "@centinela/contracts/croma";
import { buildDossier } from "../src/investigate.ts";

function tender(over: Partial<Tender> = {}): Tender {
  return {
    noticeUid: "CO1.NTC.001",
    entityNit: "899999061",
    entityName: "Alcaldía de Bogotá",
    title: "Suministro de equipos",
    valueCop: 5_000_000_000,
    status: "adjudicado",
    raw: null,
    ...over,
  };
}

/** Records the sequence of client method calls so tests can assert ordering. */
function recordingClient(over: Partial<CromaClient> = {}): {
  client: CromaClient;
  calls: Array<{ method: string; arg: string }>;
} {
  const calls: Array<{ method: string; arg: string }> = [];
  const rec =
    <T>(method: string, result: T) =>
    async (arg: string) => {
      calls.push({ method, arg });
      return result;
    };

  const company: CompanyRecord = {
    nit: "900123456",
    name: "CONSTRUCTORA FANTASMA SAS",
    status: "ACTIVA",
    incorporationDate: "2026-07-01",
    legalRepresentatives: [{ document: "79123456", name: "Juan Pérez" }],
    raw: null,
  };

  const client: CromaClient = {
    secopProcessesByEntity: rec<Tender[]>("secopProcessesByEntity", []),
    secopProcessByNotice: rec<TenderDetail | null>("secopProcessByNotice", null),
    secopContractsByProvider: rec<ProviderContract[]>("secopContractsByProvider", [
      { noticeUid: "x", entityNit: "899999061", valueCop: 1, raw: null },
    ]),
    secopSanctionsByProvider: rec<Sanction[]>("secopSanctionsByProvider", [
      { registry: "secop", subjectDocument: "900123456", raw: null },
    ]),
    ruesEntityByNit: rec<CompanyRecord | null>("ruesEntityByNit", company),
    supersociedadesFinancials: rec<FinancialRecord[]>("supersociedadesFinancials", [
      { nit: "900123456", year: 2025, totalAssetsCop: 1000, raw: null },
    ]),
    ramaJudicialCasesByEntity: rec<JudicialProcess[]>("ramaJudicialCasesByEntity", [
      { caseId: "C-1", parties: ["CONSTRUCTORA FANTASMA SAS"], raw: null },
    ]),
    procuraduriaRecords: rec<Sanction[]>("procuraduriaRecords", [
      { registry: "procuraduria", subjectDocument: "900123456", raw: null },
    ]),
    contraloriaRecords: rec<Sanction[]>("contraloriaRecords", [
      { registry: "contraloria", subjectDocument: "900123456", raw: null },
    ]),
    ...over,
  };
  return { client, calls };
}

const detail = (providers: TenderDetail["providers"]): TenderDetail => ({
  ...tender(),
  providers,
});

describe("buildDossier", () => {
  it("resolves RUES before querying rama-judicial, and queries judicial by NAME not NIT", async () => {
    const { client, calls } = recordingClient();
    await buildDossier(tender(), detail([{ nit: "900123456", awarded: true }]), client);

    const ruesIdx = calls.findIndex((c) => c.method === "ruesEntityByNit");
    const judIdx = calls.findIndex((c) => c.method === "ramaJudicialCasesByEntity");
    expect(ruesIdx).toBeGreaterThanOrEqual(0);
    expect(judIdx).toBeGreaterThan(ruesIdx);
    expect(calls[judIdx].arg).toBe("CONSTRUCTORA FANTASMA SAS");
  });

  it("merges sanctions from secop + procuraduría + contraloría", async () => {
    const { client } = recordingClient();
    const dossier = await buildDossier(
      tender(),
      detail([{ nit: "900123456" }]),
      client,
    );
    const registries = dossier.providers[0].sanctions.map((s) => s.registry).sort();
    expect(registries).toEqual(["contraloria", "procuraduria", "secop"]);
  });

  it("uses the RUES company name over the notice-supplied provider name", async () => {
    const { client, calls } = recordingClient();
    await buildDossier(
      tender(),
      detail([{ nit: "900123456", name: "Nombre viejo del aviso" }]),
      client,
    );
    const jud = calls.find((c) => c.method === "ramaJudicialCasesByEntity");
    expect(jud?.arg).toBe("CONSTRUCTORA FANTASMA SAS");
  });

  it("falls back to the notice provider name when RUES has no match", async () => {
    const { client, calls } = recordingClient({
      ruesEntityByNit: async () => null,
    });
    await buildDossier(
      tender(),
      detail([{ nit: "900999999", name: "Proveedor Sin RUES" }]),
      client,
    );
    const jud = calls.find((c) => c.method === "ramaJudicialCasesByEntity");
    expect(jud?.arg).toBe("Proveedor Sin RUES");
  });

  it("skips rama-judicial entirely when no name can be resolved", async () => {
    const { client, calls } = recordingClient({
      ruesEntityByNit: async () => null,
    });
    await buildDossier(tender(), detail([{ nit: "900999999" }]), client);
    expect(calls.some((c) => c.method === "ramaJudicialCasesByEntity")).toBe(false);
  });

  it("produces an empty provider list when the notice exposes no providers", async () => {
    const { client } = recordingClient();
    const dossier = await buildDossier(tender(), detail([]), client);
    expect(dossier.providers).toEqual([]);
    expect(dossier.tender.noticeUid).toBe("CO1.NTC.001");
  });

  it("tolerates a null tender detail (no notice expansion)", async () => {
    const { client } = recordingClient();
    const dossier = await buildDossier(tender(), null, client);
    expect(dossier.providers).toEqual([]);
    expect(dossier.detail).toBeNull();
  });
});
