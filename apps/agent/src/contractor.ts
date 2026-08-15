/**
 * Contractor sweep — coverage without sweep budget.
 *
 * Watching a contracting entity shows you that entity's tenders and nothing
 * else, and Croma's 500 req/24h ceiling caps how many entities can be swept at
 * all. Watching a CONTRACTOR inverts the problem: one request per sweep returns
 * everything that contractor won, in every entity in the country — including
 * entities the user never watched and could not afford to watch.
 *
 * `secop-contracts-by-provider` returns awarded contracts, not notices, so this
 * module maps them onto the `Tender` shape the rest of the pipeline already
 * speaks (detect → queue → investigate). Pure: no client, no clock.
 */
import type { ProviderContract, Tender } from "@centinela/contracts/croma";

/**
 * A contract is identified by `contractId`; only some payloads carry the notice
 * uid. The pipeline dedups and investigates by `noticeUid`, so fall back to the
 * contract id — investigation degrades to "no notice detail" rather than
 * dropping the award entirely.
 */
export function contractTenderId(contract: ProviderContract): string {
  return contract.noticeUid ?? contract.contractId;
}

/**
 * Map one contractor's awarded contracts onto tenders.
 *
 * `status` is fixed to "adjudicado": every row from this endpoint is an award,
 * and detect.ts hashes status + value, so a contract that later changes value
 * correctly re-enters the pipeline.
 */
export function contractsToTenders(
  contracts: readonly ProviderContract[],
  contractor: { nit: string; name: string },
): Tender[] {
  const byId = new Map<string, Tender>();
  for (const contract of contracts) {
    const noticeUid = contractTenderId(contract);
    if (!noticeUid) continue; // unusable row: nothing to dedup or fetch on
    byId.set(noticeUid, {
      noticeUid,
      entityNit: contract.entityNit,
      entityName: contract.entityName ?? contract.entityNit,
      title: `Adjudicación a ${contractor.name} · ${contract.entityName ?? contract.entityNit}`,
      ...(contract.valueCop != null ? { valueCop: contract.valueCop } : {}),
      status: "adjudicado",
      ...(contract.awardedAt ? { publishedAt: contract.awardedAt } : {}),
      raw: contract.raw,
    });
  }
  return [...byId.values()];
}

/**
 * Awards landing in entities the user does not watch — the reason to follow a
 * contractor at all, and the input for "should I watch these too?".
 */
export function unwatchedEntities(
  tenders: readonly Tender[],
  watchedEntityNits: ReadonlySet<string>,
): Array<{ nit: string; name: string; awards: number }> {
  const counts = new Map<string, { name: string; awards: number }>();
  for (const t of tenders) {
    if (watchedEntityNits.has(t.entityNit)) continue;
    const seen = counts.get(t.entityNit);
    if (seen) seen.awards++;
    else counts.set(t.entityNit, { name: t.entityName, awards: 1 });
  }
  return [...counts.entries()]
    .map(([nit, v]) => ({ nit, ...v }))
    .sort((a, b) => b.awards - a.awards || a.nit.localeCompare(b.nit));
}
