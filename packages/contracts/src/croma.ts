/**
 * Shared contract for the Croma client (`@centinela/croma`, WS1).
 *
 * WS3 (apps/agent) codes against this interface with a stub until the real
 * package merges; WS2 reuses the data types. Field shapes are conservative:
 * every record keeps the raw Croma payload in `raw` so consumers never lose
 * data while types firm up against the live API.
 *
 * Owned by the orchestrator session — changes go through it (see PLAN.md).
 * Endpoint map: AGENTS.md "Croma API".
 */

export interface PageOpts {
  /** ISO date (inclusive) — start of the sweep window. */
  from?: string;
  /** ISO date (inclusive) — end of the sweep window. */
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface Tender {
  /** SECOP notice UID — stable id used for dedup across sweeps. */
  noticeUid: string;
  entityNit: string;
  entityName: string;
  title: string;
  /** Contract value in COP, when published. */
  valueCop?: number;
  status?: string;
  publishedAt?: string;
  closesAt?: string;
  raw: unknown;
}

export interface TenderDetail extends Tender {
  /** Providers that bid / were awarded, when the notice exposes them. */
  providers: Array<{ nit: string; name?: string; awarded?: boolean }>;
}

export interface ProviderContract {
  /** SECOP `contract_id` — this endpoint does not expose a notice UID. */
  contractId: string;
  /** Only when the payload happens to include one. */
  noticeUid?: string;
  entityNit: string;
  entityName?: string;
  valueCop?: number;
  awardedAt?: string;
  raw: unknown;
}

export interface CompanyRecord {
  nit: string;
  name?: string;
  status?: string;
  incorporationDate?: string;
  legalRepresentatives: Array<{ document: string; name: string }>;
  raw: unknown;
}

export interface FinancialRecord {
  nit: string;
  year?: number;
  totalAssetsCop?: number;
  totalEquityCop?: number;
  operatingIncomeCop?: number;
  raw: unknown;
}

export interface JudicialProcess {
  caseId: string;
  court?: string;
  status?: string;
  parties: string[];
  raw: unknown;
}

export interface Sanction {
  /** Which registry it came from: secop | procuraduria | contraloria. */
  registry: string;
  subjectDocument: string;
  description?: string;
  date?: string;
  raw: unknown;
}

/**
 * One method per Croma Colombia endpoint the engine chains
 * (secop → rues → supersociedades → rama-judicial → sanciones).
 */
export interface CromaClient {
  /** `secop-processes-by-entity` — sweep new tenders for a watched entity. */
  secopProcessesByEntity(entityNit: string, opts?: PageOpts): Promise<Tender[]>;
  /** `secop-process-by-notice` — awards per provider, values. */
  secopProcessByNotice(noticeUid: string): Promise<TenderDetail | null>;
  /** `secop-contracts-by-provider` — concentration = rigging signal. */
  secopContractsByProvider(document: string): Promise<ProviderContract[]>;
  /** `secop-sanctions-by-provider` — red flag. */
  secopSanctionsByProvider(document: string): Promise<Sanction[]>;
  /** `rues-entity-by-nit` — real? incorporation date, status, legal reps. */
  ruesEntityByNit(nit: string): Promise<CompanyRecord | null>;
  /** `supersociedades-financial-statements` — capital vs contract mismatch. */
  supersociedadesFinancials(nit: string): Promise<FinancialRecord[]>;
  /** `rama-judicial-cases-by-entity` — litigation by party name. */
  ramaJudicialCasesByEntity(name: string): Promise<JudicialProcess[]>;
  /** `procuraduria-disciplinary-records` — sanctioned contractor. */
  procuraduriaRecords(document: string): Promise<Sanction[]>;
  /** `contraloria-fiscal-records` — fiscal responsibility. */
  contraloriaRecords(document: string): Promise<Sanction[]>;
}
