/**
 * Croma cross-reference — the investigation engine.
 *
 * Pure orchestration over an injected `CromaClient` (real package in prod, stub
 * in dev/tests), so the chaining logic is unit-testable without network. The
 * dependency that matters: rama-judicial is queried by entity NAME, so RUES
 * must resolve first (NIT → official name) before the judicial lookup. Every
 * downstream call keys off the provider NIT.
 */
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

export interface ProviderDossier {
  nit: string;
  /** Official name (RUES) if resolved, else the notice-supplied name. */
  name?: string;
  company: CompanyRecord | null;
  financials: FinancialRecord[];
  judicial: JudicialProcess[];
  /** secop + procuraduría + contraloría, merged. */
  sanctions: Sanction[];
  contracts: ProviderContract[];
}

export interface Dossier {
  tender: Tender;
  detail: TenderDetail | null;
  providers: ProviderDossier[];
}

async function investigateProvider(
  provider: { nit: string; name?: string; awarded?: boolean },
  client: CromaClient,
): Promise<ProviderDossier> {
  // RUES first: it yields the official name that rama-judicial needs.
  const company = await client.ruesEntityByNit(provider.nit);
  const name = company?.name ?? provider.name;

  const [financials, judicial, secopSanctions, procuraduria, contraloria, contracts] =
    await Promise.all([
      client.supersociedadesFinancials(provider.nit),
      name
        ? client.ramaJudicialCasesByEntity(name)
        : Promise.resolve<JudicialProcess[]>([]),
      client.secopSanctionsByProvider(provider.nit),
      client.procuraduriaRecords(provider.nit),
      client.contraloriaRecords(provider.nit),
      client.secopContractsByProvider(provider.nit),
    ]);

  return {
    nit: provider.nit,
    name,
    company,
    financials,
    judicial,
    sanctions: [...secopSanctions, ...procuraduria, ...contraloria],
    contracts,
  };
}

/**
 * Build the full evidence dossier for one tender by chaining Croma across every
 * provider on the notice. Providers are investigated concurrently; within a
 * provider the RUES → rama-judicial dependency is preserved.
 */
export async function buildDossier(
  tender: Tender,
  detail: TenderDetail | null,
  client: CromaClient,
): Promise<Dossier> {
  const providers = await Promise.all(
    (detail?.providers ?? []).map((p) => investigateProvider(p, client)),
  );
  return { tender, detail, providers };
}
