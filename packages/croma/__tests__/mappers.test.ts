import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  mapProviderContracts,
  mapSecopSanctions,
  mapTenderDetail,
  mapTenders,
} from "../src/endpoints/secop.ts";
import { mapCompanyRecord } from "../src/endpoints/rues.ts";
import { mapFinancials } from "../src/endpoints/supersociedades.ts";
import { mapJudicialProcesses } from "../src/endpoints/rama-judicial.ts";
import {
  mapContraloriaSanctions,
  mapProcuraduriaSanctions,
} from "../src/endpoints/disciplinary.ts";

const fixture = (id: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/${id}.json`, import.meta.url), "utf8")).data;

describe("mapTenders (secop-processes-by-entity)", () => {
  const tenders = mapTenders(fixture("secop-processes-by-entity"));

  it("maps every process to a Tender", () => {
    expect(tenders).toHaveLength(2);
  });

  it("falls back to process_id when a draft process has a null notice_uid", () => {
    const [t] = mapTenders({
      processes: [{ notice_uid: null, process_id: "CO1.REQ.10841106", entity_nit: "899999061" }],
    });
    expect(t.noticeUid).toBe("CO1.REQ.10841106");
  });

  it("maps snake_case Croma fields to the contract shape", () => {
    const t = tenders[0];
    expect(t.noticeUid).toBe("CO1.NTC.10701223");
    expect(t.entityNit).toBe("899999061");
    expect(t.entityName).toBe("ALCALDIA LOCAL DE ENGATIVÁ");
    expect(t.title.length).toBeGreaterThan(0);
    expect(t.valueCop).toBe(20460000);
    expect(t.status).toBe("Seleccionado");
    expect(t.publishedAt).toBe("2026-08-13");
    expect(t.raw).toBeDefined();
  });
});

describe("mapTenderDetail (secop-process)", () => {
  it("returns null when the notice was not found", () => {
    expect(mapTenderDetail({ found: false })).toBeNull();
  });

  it("maps a found notice with providers derived from contracts", () => {
    const detail = mapTenderDetail(fixture("secop-process"));
    expect(detail).not.toBeNull();
    expect(detail?.noticeUid).toBe("CO1.NTC.9458505");
    expect(detail?.entityNit).toBe("899999061");
    expect(detail?.valueCop).toBe(833280000);
    expect(Array.isArray(detail?.providers)).toBe(true);
    // providers with a null document are dropped
    for (const p of detail?.providers ?? []) expect(p.nit).toBeTruthy();
  });
});

describe("mapProviderContracts (secop-contracts-by-provider)", () => {
  const contracts = mapProviderContracts(fixture("secop-contracts-by-provider"));

  it("maps contracts with value and award date", () => {
    const c = contracts[0];
    expect(c.contractId).toBe("CO1.PCCNTR.9132006");
    expect(c.entityNit).toBe("899999061");
    expect(c.valueCop).toBe(23808000);
    expect(c.awardedAt).toBe("2026-01-27");
    expect(c.raw).toBeDefined();
  });
});

describe("mapSecopSanctions (secop-sanctions-by-provider)", () => {
  const sanctions = mapSecopSanctions(fixture("secop-sanctions-by-provider"));

  it("tags registry secop and carries the queried document", () => {
    const s = sanctions[0];
    expect(s.registry).toBe("secop");
    expect(s.subjectDocument).toBe("1067811412");
    expect(s.date).toBe("2019-11-07");
    expect(s.description).toContain("JORGE HUMBERTO FERIAS MANJARRES");
    expect(s.raw).toBeDefined();
  });
});

describe("mapCompanyRecord (rues-entity-by-nit)", () => {
  it("returns null when not found", () => {
    expect(mapCompanyRecord({ found: false })).toBeNull();
  });

  it("maps entity and legal representatives from related_parties", () => {
    const rec = mapCompanyRecord(fixture("rues-entity-by-nit"));
    expect(rec?.nit).toBe("900654922");
    expect(rec?.name).toBe("AGROINDUSTRIAS COPER S.A.S. EN LIQUIDACION");
    expect(rec?.status).toBe("ACTIVA");
    expect(rec?.legalRepresentatives.length).toBeGreaterThanOrEqual(1);
    expect(rec?.legalRepresentatives[0]).toEqual({
      document: "1088004672",
      name: "MURILLO GRANDA SEBASTIAN",
    });
  });
});

describe("mapFinancials (supersociedades-financial-statements)", () => {
  it("returns empty when not found", () => {
    expect(mapFinancials({ found: false, statements: [] })).toEqual([]);
  });

  it("maps statements and converts MILES DE PESOS to COP", () => {
    const fin = mapFinancials(fixture("supersociedades-financial-statements"));
    expect(fin).toHaveLength(1);
    const f = fin[0];
    expect(f.nit).toBe("900249127");
    expect(f.year).toBe(2025);
    expect(f.totalAssetsCop).toBe(3_271_906_000); // 3271906 * 1000
    expect(f.totalEquityCop).toBe(2_157_149_000);
    expect(f.operatingIncomeCop).toBe(225_523_000);
    expect(f.raw).toBeDefined();
  });
});

describe("mapJudicialProcesses (rama-judicial-cases-by-entity)", () => {
  const cases = mapJudicialProcesses(fixture("rama-judicial-cases-by-entity"));

  it("maps radicado, court and split parties", () => {
    const c = cases[0];
    expect(c.caseId).toBe("76001410500520140034800");
    expect(c.court).toContain("JUZGADO");
    expect(c.parties).toEqual([
      "Demandante: PEDRO NEL CIFUENTES",
      "Demandado: ADMINISTRADORA DE PENSIONES COLPENSIONES",
    ]);
    expect(c.raw).toBeDefined();
  });
});

describe("mapProcuraduriaSanctions (procuraduria-disciplinary-records)", () => {
  it("returns empty when there are no records", () => {
    expect(mapProcuraduriaSanctions(fixture("procuraduria-disciplinary-records"))).toEqual([]);
  });

  it("maps records to procuraduria sanctions", () => {
    const out = mapProcuraduriaSanctions({
      document_number: "79015438",
      has_records: true,
      records: [{ type: "Disciplinario", description: "Suspensión", date: "2021-03-01" }],
    });
    expect(out).toHaveLength(1);
    expect(out[0].registry).toBe("procuraduria");
    expect(out[0].subjectDocument).toBe("79015438");
    expect(out[0].date).toBe("2021-03-01");
    expect(out[0].raw).toBeDefined();
  });
});

describe("mapContraloriaSanctions (contraloria-fiscal-records)", () => {
  it("returns empty when not a fiscal responsible", () => {
    expect(mapContraloriaSanctions(fixture("contraloria-fiscal-records"))).toEqual([]);
  });

  it("maps a fiscal responsible to a single contraloria sanction", () => {
    const out = mapContraloriaSanctions({
      document_number: "79015438",
      is_fiscal_responsible: true,
      status: "Responsable fiscal",
      certified_at: "2026-08-15T00:49:05",
    });
    expect(out).toHaveLength(1);
    expect(out[0].registry).toBe("contraloria");
    expect(out[0].subjectDocument).toBe("79015438");
    expect(out[0].date).toBe("2026-08-15T00:49:05");
  });
});
