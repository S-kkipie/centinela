import type { CromaClient, PageOpts } from "@centinela/contracts/croma";
import { CromaNotFoundError } from "./errors.ts";
import { type Limiter, type Transport, createTransport } from "./http.ts";
import { TokenBucket } from "./rate-limiter.ts";
import {
  mapProviderContracts,
  mapSecopSanctions,
  mapTenderDetail,
  mapTenders,
} from "./endpoints/secop.ts";
import { mapCompanyRecord } from "./endpoints/rues.ts";
import { mapFinancials } from "./endpoints/supersociedades.ts";
import { mapJudicialProcesses } from "./endpoints/rama-judicial.ts";
import {
  mapContraloriaSanctions,
  mapProcuraduriaSanctions,
} from "./endpoints/disciplinary.ts";

const DEFAULT_BASE_URL = "https://api.croma.run";

export interface CromaClientOptions {
  apiKey: string;
  baseUrl?: string;
  /** Injectable fetch (Workers/Node). Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  /** Retry attempts after the first try (default 3). */
  maxRetries?: number;
  /**
   * Rate-limiter config, or `false` to disable. Croma's limit is 500/24h *per
   * endpoint*; this client-wide bucket is a conservative burst guard — long
   * sweeps should tune it to their daily budget.
   */
  rateLimit?: { tokensPerInterval: number; intervalMs: number; maxBurst?: number } | false;
  /** Bring your own limiter (overrides `rateLimit`). */
  limiter?: Limiter;
  /** Pre-built transport (mainly for tests). Overrides all HTTP options. */
  transport?: Transport;
}

function resolveLimiter(options: CromaClientOptions): Limiter | undefined {
  if (options.limiter) return options.limiter;
  if (options.rateLimit === false) return undefined;
  const cfg = options.rateLimit ?? { tokensPerInterval: 60, intervalMs: 60_000, maxBurst: 20 };
  return new TokenBucket(cfg);
}

/** Return `null` if the rejection is a 404, else rethrow. */
async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof CromaNotFoundError) return null;
    throw err;
  }
}

/** Return `[]` if the rejection is a 404, else rethrow. */
async function orEmpty<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof CromaNotFoundError) return [];
    throw err;
  }
}

function secopBody(entityNit: string, opts?: PageOpts): Record<string, unknown> {
  const body: Record<string, unknown> = { document_number: entityNit };
  if (opts?.from !== undefined) body.from_date = opts.from;
  if (opts?.to !== undefined) body.to_date = opts.to;
  if (opts?.page !== undefined) body.page = opts.page;
  return body;
}

/**
 * Build a typed Croma client. Every method maps its endpoint's `{ data }`
 * envelope to the shared `@centinela/contracts` types.
 */
export function createCromaClient(options: CromaClientOptions): CromaClient {
  const transport =
    options.transport ??
    createTransport({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      apiKey: options.apiKey,
      fetchImpl: options.fetchImpl,
      maxRetries: options.maxRetries,
      limiter: resolveLimiter(options),
    });

  const req = (path: string, body: Record<string, unknown>): Promise<unknown> =>
    transport.request(path, body);

  return {
    secopProcessesByEntity: async (entityNit, opts) =>
      mapTenders(await req("/co/secop/processes-by-entity/v1", secopBody(entityNit, opts))),

    secopProcessByNotice: async (noticeUid) =>
      orNull(
        req("/co/secop/process/v1", { notice_uid: noticeUid }).then(mapTenderDetail),
      ),

    secopContractsByProvider: async (document) =>
      orEmpty(
        req("/co/secop/contracts-by-provider/v1", { document_number: document }).then(
          mapProviderContracts,
        ),
      ),

    secopSanctionsByProvider: async (document) =>
      orEmpty(
        req("/co/secop/sanctions-by-provider/v1", { document_number: document }).then(
          mapSecopSanctions,
        ),
      ),

    ruesEntityByNit: async (nit) =>
      orNull(req("/co/rues/entity-by-nit/v1", { document_number: nit }).then(mapCompanyRecord)),

    supersociedadesFinancials: async (nit) =>
      orEmpty(
        req("/co/supersociedades/financial-statements/v1", { document_number: nit }).then(
          mapFinancials,
        ),
      ),

    ramaJudicialCasesByEntity: async (name) =>
      orEmpty(req("/co/rama-judicial/cases-by-entity/v1", { name }).then(mapJudicialProcesses)),

    procuraduriaRecords: async (document) =>
      orEmpty(
        req("/co/procuraduria/disciplinary-records/v1", { document_number: document }).then(
          mapProcuraduriaSanctions,
        ),
      ),

    contraloriaRecords: async (document) =>
      orEmpty(
        req("/co/contraloria/fiscal-records/v1", { document_number: document }).then(
          mapContraloriaSanctions,
        ),
      ),
  };
}
