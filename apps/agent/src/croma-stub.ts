/**
 * Stub `CromaClient` — placeholder until WS1 publishes `@centinela/croma`.
 *
 * Codes against the exact shared interface (`@centinela/contracts/croma`) so the
 * swap at merge is a one-line change in `createCromaClient` below: return the
 * real client instead of this stub. Fixtures encode a demo "empresa fantasma"
 * scenario (a month-old company winning a 12-billion-COP contract) so the loop
 * produces a believable BANDERA_ROJA end-to-end before live Croma is wired.
 */
import type {
  CompanyRecord,
  CromaClient,
  FinancialRecord,
  JudicialProcess,
  PageOpts,
  ProviderContract,
  Sanction,
  TenderDetail,
  Tender,
} from "@centinela/contracts/croma";

const FANTASMA_NIT = "900123456";

const DEMO_TENDERS: Tender[] = [
  {
    noticeUid: "CO1.NTC.DEMO001",
    entityNit: "899999061",
    entityName: "Alcaldía Mayor de Bogotá",
    title: "Construcción de puente peatonal en la Calle 100",
    valueCop: 12_000_000_000,
    status: "adjudicado",
    publishedAt: "2026-08-01",
    raw: { demo: true },
  },
];

export function createStubCromaClient(): CromaClient {
  return {
    async secopProcessesByEntity(_entityNit: string, _opts?: PageOpts): Promise<Tender[]> {
      return DEMO_TENDERS;
    },
    async secopProcessByNotice(noticeUid: string): Promise<TenderDetail | null> {
      const tender = DEMO_TENDERS.find((t) => t.noticeUid === noticeUid);
      if (!tender) return null;
      return { ...tender, providers: [{ nit: FANTASMA_NIT, name: "CONSTRUCTORA FANTASMA SAS", awarded: true }] };
    },
    async secopContractsByProvider(document: string): Promise<ProviderContract[]> {
      if (document !== FANTASMA_NIT) return [];
      return [
        { noticeUid: "CO1.NTC.DEMO001", entityNit: "899999061", valueCop: 12_000_000_000, awardedAt: "2026-08-01", raw: {} },
      ];
    },
    async secopSanctionsByProvider(): Promise<Sanction[]> {
      return [];
    },
    async ruesEntityByNit(nit: string): Promise<CompanyRecord | null> {
      if (nit !== FANTASMA_NIT) return null;
      return {
        nit: FANTASMA_NIT,
        name: "CONSTRUCTORA FANTASMA SAS",
        status: "ACTIVA",
        incorporationDate: "2026-07-01",
        legalRepresentatives: [{ document: "79123456", name: "Juan Pérez" }],
        raw: {},
      };
    },
    async supersociedadesFinancials(nit: string): Promise<FinancialRecord[]> {
      if (nit !== FANTASMA_NIT) return [];
      return [{ nit: FANTASMA_NIT, year: 2025, totalAssetsCop: 5_000_000, totalEquityCop: 2_000_000, raw: {} }];
    },
    async ramaJudicialCasesByEntity(): Promise<JudicialProcess[]> {
      return [];
    },
    async procuraduriaRecords(): Promise<Sanction[]> {
      return [];
    },
    async contraloriaRecords(): Promise<Sanction[]> {
      return [];
    },
  };
}

/**
 * Single swap point. When `@centinela/croma` merges, replace the body with:
 *   import { CromaClient as RealClient } from "@centinela/croma";
 *   return new RealClient({ apiKey: env.CROMA_API_KEY });
 */
export function createCromaClient(_env: { CROMA_API_KEY: string }): CromaClient {
  return createStubCromaClient();
}
