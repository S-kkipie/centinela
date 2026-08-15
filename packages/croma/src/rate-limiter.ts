/**
 * A token-bucket rate limiter that works in Workers and Node (no timers held
 * open — it sleeps only while a caller is waiting).
 *
 * Croma's documented limit is 500 requests / 24h *per endpoint*, with no
 * per-minute cap. This bucket is deliberately generic: the default is a
 * conservative burst guard; callers that run long sweeps should tighten
 * `tokensPerInterval` / `intervalMs` to fit their daily budget.
 *
 * Acquisitions are serialized so concurrent callers queue in FIFO order rather
 * than all reading the same token count.
 */

export interface TokenBucketOptions {
  /** Tokens replenished per `intervalMs`. */
  tokensPerInterval: number;
  /** Length of the refill window, in milliseconds. */
  intervalMs: number;
  /** Max tokens the bucket holds (burst size). Defaults to `tokensPerInterval`. */
  maxBurst?: number;
  /** Injectable clock (ms). Defaults to `Date.now`. */
  now?: () => number;
  /** Injectable sleep. Defaults to `setTimeout`. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class TokenBucket {
  private readonly tokensPerInterval: number;
  private readonly intervalMs: number;
  private readonly capacity: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  private tokens: number;
  private lastRefill: number;
  /** Tail of the FIFO queue: each acquire chains onto the previous one. */
  private tail: Promise<void> = Promise.resolve();

  constructor(options: TokenBucketOptions) {
    if (options.tokensPerInterval <= 0) throw new Error("tokensPerInterval must be > 0");
    if (options.intervalMs <= 0) throw new Error("intervalMs must be > 0");
    this.tokensPerInterval = options.tokensPerInterval;
    this.intervalMs = options.intervalMs;
    this.capacity = options.maxBurst ?? options.tokensPerInterval;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.tokens = this.capacity;
    this.lastRefill = this.now();
  }

  /** Resolve once a token is available, consuming it. */
  async acquire(): Promise<void> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      await this.take();
    } finally {
      release();
    }
  }

  private refill(): void {
    const current = this.now();
    const elapsed = current - this.lastRefill;
    if (elapsed <= 0) return;
    const refilled = (elapsed * this.tokensPerInterval) / this.intervalMs;
    this.tokens = Math.min(this.capacity, this.tokens + refilled);
    this.lastRefill = current;
  }

  private async take(): Promise<void> {
    this.refill();
    if (this.tokens < 1) {
      const needed = 1 - this.tokens;
      const waitMs = Math.ceil((needed * this.intervalMs) / this.tokensPerInterval);
      await this.sleep(waitMs);
      this.refill();
    }
    this.tokens -= 1;
  }
}
