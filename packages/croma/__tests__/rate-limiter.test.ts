import { describe, expect, it } from "vitest";
import { TokenBucket } from "../src/rate-limiter.ts";

/**
 * Deterministic fake clock: `now` is manual, `sleep` advances it instantly and
 * records the requested delay so tests can assert on scheduling without waiting.
 */
function fakeClock(start = 0) {
  let t = start;
  const slept: number[] = [];
  return {
    now: () => t,
    sleep: (ms: number) => {
      slept.push(ms);
      t += ms;
      return Promise.resolve();
    },
    advance: (ms: number) => {
      t += ms;
    },
    slept,
  };
}

describe("TokenBucket", () => {
  it("allows an immediate burst up to capacity without sleeping", async () => {
    const clock = fakeClock();
    const bucket = new TokenBucket({
      tokensPerInterval: 5,
      intervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    });

    for (let i = 0; i < 5; i++) await bucket.acquire();

    expect(clock.slept).toEqual([]);
  });

  it("waits for a refill once the burst is spent", async () => {
    const clock = fakeClock();
    const bucket = new TokenBucket({
      tokensPerInterval: 2,
      intervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    });

    await bucket.acquire();
    await bucket.acquire();
    // bucket empty: next acquire must wait for one token to refill.
    // refill rate = 2 tokens / 1000ms => 1 token every 500ms.
    await bucket.acquire();

    expect(clock.slept).toEqual([500]);
  });

  it("refills over elapsed time without sleeping when tokens are available", async () => {
    const clock = fakeClock();
    const bucket = new TokenBucket({
      tokensPerInterval: 1,
      intervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    });

    await bucket.acquire(); // spends the only token
    clock.advance(1000); // a full interval passes -> 1 token back
    await bucket.acquire();

    expect(clock.slept).toEqual([]);
  });

  it("does not accumulate tokens beyond capacity", async () => {
    const clock = fakeClock();
    const bucket = new TokenBucket({
      tokensPerInterval: 2,
      intervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    });

    clock.advance(10_000); // long idle, but capacity caps at 2
    await bucket.acquire();
    await bucket.acquire();
    await bucket.acquire(); // third must wait half an interval

    expect(clock.slept).toEqual([500]);
  });

  it("serializes concurrent acquisitions in order", async () => {
    const clock = fakeClock();
    const bucket = new TokenBucket({
      tokensPerInterval: 1,
      intervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    });

    await Promise.all([bucket.acquire(), bucket.acquire(), bucket.acquire()]);

    // first is free; each subsequent one waits a full interval.
    expect(clock.slept).toEqual([1000, 1000]);
  });
});
