/**
 * New-tender detection — the heartbeat's memory.
 *
 * Pure logic, no runtime deps: the Durable Object holds the `SeenMap` in SQLite
 * and calls this each sweep. A tender is "new" when its notice id is unseen OR
 * its status hash changed since last sweep — the latter catches the phase
 * transition (convocatoria → adjudicado) that is the core BANDERA_ROJA signal.
 */
import type { Tender } from "@centinela/contracts/croma";

/** noticeUid → status hash, persisted in the DO between heartbeats. */
export type SeenMap = Record<string, string>;

/**
 * Canonical fingerprint of the fields whose change means "look again":
 * lifecycle status and published contract value.
 */
export function statusHash(tender: Tender): string {
  return `${tender.status ?? ""}|${tender.valueCop ?? ""}`;
}

export interface DetectResult {
  newTenders: Tender[];
  nextSeenMap: SeenMap;
}

/**
 * Diff a freshly-fetched batch against the seen map.
 * Returns the tenders to investigate and the updated map to persist.
 * Within one batch a repeated uid collapses to its last occurrence.
 */
export function detectNewTenders(fetched: Tender[], seen: SeenMap): DetectResult {
  const nextSeenMap: SeenMap = { ...seen };
  const newByUid = new Map<string, Tender>();

  for (const tender of fetched) {
    const hash = statusHash(tender);
    if (nextSeenMap[tender.noticeUid] !== hash) {
      newByUid.set(tender.noticeUid, tender);
    }
    nextSeenMap[tender.noticeUid] = hash;
  }

  return { newTenders: [...newByUid.values()], nextSeenMap };
}
