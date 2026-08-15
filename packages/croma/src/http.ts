/**
 * The Croma HTTP transport: one `request()` that POSTs a JSON body, unwraps the
 * `{ data }` envelope, maps failures to typed errors, and retries transient
 * ones (429 + 5xx + network) with exponential backoff, honoring `Retry-After`.
 *
 * `fetch`, `sleep`, and the rate limiter are injected so the whole thing runs
 * on Workers and Node and is deterministic under test.
 */

import { CromaError, errorFromResponse } from "./errors.ts";

export interface Limiter {
  acquire(): Promise<void>;
}

export interface TransportOptions {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  limiter?: Limiter;
  /** Retry attempts after the first try (default 3). */
  maxRetries?: number;
  /** Base delay for exponential backoff, in ms (default 500). */
  backoffBaseMs?: number;
}

export interface Transport {
  request(path: string, body: Record<string, unknown>): Promise<unknown>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function parseRetryAfter(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (raw === null) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? seconds : undefined;
}

async function parseBody(res: Response): Promise<Record<string, unknown>> {
  try {
    const text = await res.text();
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function createTransport(options: TransportOptions): Transport {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const maxRetries = options.maxRetries ?? 3;
  const backoffBaseMs = options.backoffBaseMs ?? 500;
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  const backoff = (attempt: number): number => backoffBaseMs * 2 ** attempt;

  async function request(path: string, body: Record<string, unknown>): Promise<unknown> {
    const url = `${baseUrl}${path}`;
    const init: RequestInit = {
      method: "POST",
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    };

    for (let attempt = 0; ; attempt++) {
      await options.limiter?.acquire();

      let res: Response;
      try {
        res = await fetchImpl(url, init);
      } catch (cause) {
        if (attempt < maxRetries) {
          await sleep(backoff(attempt));
          continue;
        }
        throw new CromaError(
          `Croma request to ${path} failed: ${(cause as Error)?.message ?? "network error"}`,
          { endpoint: path, cause },
        );
      }

      if (res.ok) {
        const parsed = await parseBody(res);
        return parsed.data;
      }

      const parsed = await parseBody(res);
      const retryAfterSeconds = parseRetryAfter(res);
      const err = errorFromResponse(res.status, parsed, { endpoint: path, retryAfterSeconds });

      if (isRetryable(res.status) && attempt < maxRetries) {
        const waitMs = retryAfterSeconds !== undefined ? retryAfterSeconds * 1000 : backoff(attempt);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }

  return { request };
}
