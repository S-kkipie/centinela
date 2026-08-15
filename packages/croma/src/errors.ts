/**
 * Typed errors for the Croma client. Every failure surfaces as a
 * `CromaError` (or subclass) carrying the endpoint and, when the API
 * answered, the HTTP status and envelope error code.
 */

export interface CromaErrorInit {
  status?: number;
  code?: string;
  endpoint: string;
  cause?: unknown;
}

export class CromaError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly endpoint: string;

  constructor(message: string, init: CromaErrorInit) {
    super(message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = "CromaError";
    this.status = init.status;
    this.code = init.code;
    this.endpoint = init.endpoint;
  }
}

/** 401 / 403 — bad or missing API key. Not retryable. */
export class CromaAuthError extends CromaError {
  constructor(message: string, init: CromaErrorInit) {
    super(message, init);
    this.name = "CromaAuthError";
  }
}

/** 429 — quota exhausted. Retryable after `retryAfterMs`. */
export class CromaRateLimitError extends CromaError {
  readonly retryAfterMs?: number;

  constructor(message: string, init: CromaErrorInit & { retryAfterMs?: number }) {
    super(message, init);
    this.name = "CromaRateLimitError";
    this.retryAfterMs = init.retryAfterMs;
  }
}

/** 404 — no record for the given input. Callers usually map this to `null`. */
export class CromaNotFoundError extends CromaError {
  constructor(message: string, init: CromaErrorInit) {
    super(message, init);
    this.name = "CromaNotFoundError";
  }
}

/** Response body did not match the expected schema. Not retryable. */
export class CromaValidationError extends CromaError {
  readonly issues: string[];

  constructor(message: string, init: { endpoint: string; issues: string[]; cause?: unknown }) {
    super(message, { endpoint: init.endpoint, cause: init.cause });
    this.name = "CromaValidationError";
    this.issues = init.issues;
  }
}

interface EnvelopeError {
  error?: { type?: string; code?: string; message?: string };
}

/** Build the right error subclass from an HTTP status + parsed error envelope. */
export function errorFromResponse(
  status: number,
  body: EnvelopeError,
  ctx: { endpoint: string; retryAfterSeconds?: number },
): CromaError {
  const envelope = body?.error ?? {};
  const code = envelope.code;
  const message = envelope.message ?? `Croma request failed (HTTP ${status})`;
  const init = { status, code, endpoint: ctx.endpoint };

  if (status === 401 || status === 403) return new CromaAuthError(message, init);
  if (status === 429) {
    return new CromaRateLimitError(message, {
      ...init,
      retryAfterMs:
        ctx.retryAfterSeconds !== undefined ? ctx.retryAfterSeconds * 1000 : undefined,
    });
  }
  if (status === 404) return new CromaNotFoundError(message, init);
  return new CromaError(message, init);
}
