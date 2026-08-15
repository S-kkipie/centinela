/**
 * What the agent can be told to watch, and what that costs.
 *
 * Two shared facts live here because the web app and the agent must agree on
 * them or the console lies about the agent's behaviour:
 *
 * 1. A watch target is not always a contracting entity. Following a CONTRACTOR
 *    is how coverage grows without spending sweep budget: one contractor sweep
 *    surfaces its awards across every entity in the country, including ones the
 *    user never watched.
 * 2. Croma allows 500 requests / 24h PER ENDPOINT. That ceiling — not product
 *    ambition — is what caps how much can be watched, so both sides compute it
 *    from the same numbers.
 *
 * Owned by the orchestrator session — changes go through it (see PLAN.md).
 */

export const WATCH_TARGET_KINDS = ["contratante", "contratista"] as const;
export type WatchTargetKind = (typeof WATCH_TARGET_KINDS)[number];

export const DEFAULT_WATCH_TARGET_KIND: WatchTargetKind = "contratante";

export function isWatchTargetKind(value: unknown): value is WatchTargetKind {
    return (
        typeof value === "string" &&
        (WATCH_TARGET_KINDS as readonly string[]).includes(value)
    );
}

export interface WatchTarget {
    /** NIT (entity) or document id (contractor). The sweep key. */
    nit: string;
    name: string;
    kind: WatchTargetKind;
}

/* ── Budget ─────────────────────────────────────────────────────────────── */

/** Croma's documented cap: 500 requests per 24h, per endpoint. */
export const CROMA_DAILY_QUOTA = 500;

/** Heartbeat cadence: every two hours — 12 ticks a day. */
export const SWEEPS_PER_DAY = 12;

/**
 * Each target costs exactly one request per sweep, always on the same endpoint
 * (`secop-processes-by-entity` for a contratante, `secop-contracts-by-provider`
 * for a contratista). So the two kinds draw on two separate 500-req budgets.
 */
export const MAX_TARGETS_PER_KIND = Math.floor(
    CROMA_DAILY_QUOTA / SWEEPS_PER_DAY,
);

/**
 * An investigation hits 7 endpoints once per provider on the notice (RUES,
 * supersociedades, rama-judicial, secop-sanctions, procuraduría, contraloría,
 * secop-contracts). The binding constraint is the busiest endpoint, so cost is
 * counted in providers, not requests.
 */
export const AVG_PROVIDERS_PER_TENDER = 2;

export const MAX_INVESTIGATIONS_PER_DAY = Math.floor(
    CROMA_DAILY_QUOTA / AVG_PROVIDERS_PER_TENDER,
);

/**
 * Per-tick enqueue cap that keeps the day inside budget. The agent MUST use
 * this rather than a hand-picked number: at 25/tick the old cap spent 300
 * investigations a day against a 250 ceiling.
 */
export const MAX_ENQUEUE_PER_SWEEP = Math.floor(
    MAX_INVESTIGATIONS_PER_DAY / SWEEPS_PER_DAY,
);

export interface SweepBudget {
    kind: WatchTargetKind;
    /** Targets of this kind currently watched. */
    used: number;
    /** Targets of this kind that fit in the daily quota. */
    ceiling: number;
    /** Requests this kind spends per day. */
    requestsPerDay: number;
    /** Free slots; 0 when full or over. */
    remaining: number;
    /** True once the sweep would exceed the quota — findings start dropping. */
    overBudget: boolean;
}

/** Budget for one kind of target. */
export function sweepBudget(
    kind: WatchTargetKind,
    targetCount: number,
): SweepBudget {
    const requestsPerDay = targetCount * SWEEPS_PER_DAY;
    return {
        kind,
        used: targetCount,
        ceiling: MAX_TARGETS_PER_KIND,
        requestsPerDay,
        remaining: Math.max(0, MAX_TARGETS_PER_KIND - targetCount),
        overBudget: requestsPerDay > CROMA_DAILY_QUOTA,
    };
}

/** Budget per kind for a mixed set of targets. */
export function sweepBudgets(
    targets: readonly { kind: WatchTargetKind }[],
): Record<WatchTargetKind, SweepBudget> {
    const counts: Record<WatchTargetKind, number> = {
        contratante: 0,
        contratista: 0,
    };
    for (const t of targets) counts[t.kind]++;
    return {
        contratante: sweepBudget("contratante", counts.contratante),
        contratista: sweepBudget("contratista", counts.contratista),
    };
}
