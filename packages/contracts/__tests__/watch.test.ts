import { describe, expect, it } from "vitest";
import {
  AVG_PROVIDERS_PER_TENDER,
  CROMA_DAILY_QUOTA,
  isWatchTargetKind,
  MAX_ENQUEUE_PER_SWEEP,
  MAX_INVESTIGATIONS_PER_DAY,
  MAX_TARGETS_PER_KIND,
  SWEEPS_PER_DAY,
  sweepBudget,
  sweepBudgets,
  WATCH_TARGET_KINDS,
} from "../src/watch.ts";

describe("watch target kinds", () => {
  it("covers both sides of a contract", () => {
    expect(WATCH_TARGET_KINDS).toEqual(["contratante", "contratista"]);
  });

  it("rejects anything else", () => {
    expect(isWatchTargetKind("contratante")).toBe(true);
    expect(isWatchTargetKind("contratista")).toBe(true);
    expect(isWatchTargetKind("proveedor")).toBe(false);
    expect(isWatchTargetKind(null)).toBe(false);
    expect(isWatchTargetKind(undefined)).toBe(false);
  });
});

describe("budget constants", () => {
  it("derives the target ceiling from the quota, not a guess", () => {
    expect(MAX_TARGETS_PER_KIND).toBe(
      Math.floor(CROMA_DAILY_QUOTA / SWEEPS_PER_DAY),
    );
    expect(MAX_TARGETS_PER_KIND).toBe(41);
  });

  it("derives the investigation ceiling from providers per tender", () => {
    expect(MAX_INVESTIGATIONS_PER_DAY).toBe(
      Math.floor(CROMA_DAILY_QUOTA / AVG_PROVIDERS_PER_TENDER),
    );
  });

  // The old hand-picked cap of 25/tick spent 300 investigations against a 250
  // ceiling — a full day of sweeps would have started failing on quota.
  it("keeps a full day of sweeps inside the investigation ceiling", () => {
    expect(MAX_ENQUEUE_PER_SWEEP * SWEEPS_PER_DAY).toBeLessThanOrEqual(
      MAX_INVESTIGATIONS_PER_DAY,
    );
  });
});

describe("sweepBudget", () => {
  it("reports free slots below the ceiling", () => {
    const b = sweepBudget("contratante", 6);
    expect(b).toMatchObject({
      kind: "contratante",
      used: 6,
      ceiling: MAX_TARGETS_PER_KIND,
      requestsPerDay: 6 * SWEEPS_PER_DAY,
      overBudget: false,
    });
    expect(b.remaining).toBe(MAX_TARGETS_PER_KIND - 6);
  });

  it("is not over budget exactly at the ceiling", () => {
    const b = sweepBudget("contratante", MAX_TARGETS_PER_KIND);
    expect(b.remaining).toBe(0);
    expect(b.overBudget).toBe(false);
    expect(b.requestsPerDay).toBeLessThanOrEqual(CROMA_DAILY_QUOTA);
  });

  it("flags going over, and never reports negative slots", () => {
    const b = sweepBudget("contratista", MAX_TARGETS_PER_KIND + 5);
    expect(b.overBudget).toBe(true);
    expect(b.remaining).toBe(0);
  });
});

describe("sweepBudgets", () => {
  // The two kinds hit different endpoints, so they draw on separate quotas —
  // 40 entities must not make one contractor look unaffordable.
  it("budgets each kind against its own quota", () => {
    const targets = [
      ...Array.from({ length: 40 }, () => ({ kind: "contratante" as const })),
      { kind: "contratista" as const },
    ];
    const budgets = sweepBudgets(targets);
    expect(budgets.contratante.used).toBe(40);
    expect(budgets.contratante.overBudget).toBe(false);
    expect(budgets.contratista.used).toBe(1);
    expect(budgets.contratista.remaining).toBe(MAX_TARGETS_PER_KIND - 1);
  });

  it("handles an empty set", () => {
    const budgets = sweepBudgets([]);
    expect(budgets.contratante.used).toBe(0);
    expect(budgets.contratista.remaining).toBe(MAX_TARGETS_PER_KIND);
  });
});
