/**
 * What changed in the feed between two polls.
 *
 * The dashboard already polls every 5s, but nothing watched the result: a new
 * red flag would appear silently in a list the user was not looking at. This is
 * the heartbeat made visible — the agent interrupting on its own.
 */

import { ALERT_SCORE, type BriefingFinding, topRedFlag } from "./briefing";

export type FeedDiff<T extends BriefingFinding> = {
    /** Items whose ids were not in the previous poll. */
    fresh: T[];
    /** Fresh items that are red flags, worst first. */
    freshRedFlags: T[];
    /**
     * The one worth interrupting for: highest-scoring fresh red flag at or
     * above ALERT_SCORE. null = notice it quietly, do not steal the screen.
     */
    alert: T | null;
};

export function diffFeed<T extends BriefingFinding>(
    previousIds: ReadonlySet<string>,
    next: readonly T[],
): FeedDiff<T> {
    const fresh = next.filter((f) => !previousIds.has(f.id));
    const freshRedFlags = fresh
        .filter((f) => f.kind === "BANDERA_ROJA")
        .sort(
            (a, b) =>
                b.score - a.score || b.createdAt.localeCompare(a.createdAt),
        );
    const worst = topRedFlag(fresh);
    return {
        fresh,
        freshRedFlags,
        alert: worst && worst.score >= ALERT_SCORE ? worst : null,
    };
}

/** One activity-ticker line per poll, or null when nothing happened. */
export function describeDiff<T extends BriefingFinding>(
    diff: FeedDiff<T>,
): string | null {
    if (diff.fresh.length === 0) return null;
    const n = diff.fresh.length;
    const noun = n === 1 ? "hallazgo nuevo" : "hallazgos nuevos";
    if (diff.freshRedFlags.length === 0)
        return `Barrido: ${n} ${noun}, sin banderas rojas.`;
    const reds = diff.freshRedFlags.length;
    return `Barrido: ${n} ${noun}, ${reds} ${reds === 1 ? "bandera roja" : "banderas rojas"}.`;
}

/** The chat message the copilot posts when it decides to interrupt. */
export function alertMessage<T extends BriefingFinding>(finding: T): string {
    return [
        `🚩 Bandera roja nueva en ${finding.entityName}, score ${finding.score}.`,
        `"${finding.title}"`,
        "Te llevé a su informe. Dime si quieres ver su red de contratistas.",
    ].join("\n");
}
