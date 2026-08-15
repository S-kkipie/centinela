/**
 * `@centinela/croma` — typed REST client for Croma's Colombia endpoints.
 *
 * Data types (`Tender`, `CompanyRecord`, `Sanction`, …) and the `CromaClient`
 * interface live in `@centinela/contracts/croma` — import them from there; this
 * package does not re-export them (see AGENTS.md conventions).
 */

export { createCromaClient } from "./client.ts";
export type { CromaClientOptions } from "./client.ts";
export {
  CromaAuthError,
  CromaError,
  CromaNotFoundError,
  CromaRateLimitError,
  CromaValidationError,
} from "./errors.ts";
export { TokenBucket } from "./rate-limiter.ts";
export type { TokenBucketOptions } from "./rate-limiter.ts";
export type { Limiter, Transport } from "./http.ts";
