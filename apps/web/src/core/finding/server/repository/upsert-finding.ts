import "server-only";
import type { FindingIngest } from "@centinela/contracts/finding";
import { db } from "@/server/drizzle/db";
import {
    type FindingRow,
    findings,
} from "@/server/drizzle/schemas/finding-schema";

/**
 * Insert a finding, or update it in place when the same tender is swept again.
 * Idempotent on `(watchlist_id, tender_id)`.
 */
export async function upsertFinding(
    watchlistId: string,
    payload: FindingIngest,
): Promise<FindingRow> {
    const values = {
        watchlistId,
        tenderId: payload.tenderId,
        entityId: payload.entityId,
        entityName: payload.entityName,
        kind: payload.kind,
        score: payload.score,
        title: payload.title,
        summary: payload.summary,
        evidence: payload.evidence,
        raw: payload.raw ?? null,
    };
    const [row] = await db
        .insert(findings)
        .values(values)
        .onConflictDoUpdate({
            target: [findings.watchlistId, findings.tenderId],
            set: {
                entityName: values.entityName,
                kind: values.kind,
                score: values.score,
                title: values.title,
                summary: values.summary,
                evidence: values.evidence,
                raw: values.raw,
                updatedAt: new Date(),
            },
        })
        .returning();
    return row;
}
