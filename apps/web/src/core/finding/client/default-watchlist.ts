/**
 * Which watchlist the Panel should open on. Picking `watchlists[0]` means a
 * freshly created (and therefore empty) watchlist hijacks the Panel, since the
 * list is sorted newest-first — so follow the findings instead.
 */

type WatchlistLike = { id: string };
type FindingLike = { watchlistId: string; createdAt: string };

export function pickDefaultWatchlist(
    watchlists: WatchlistLike[] | undefined,
    findings: FindingLike[] | undefined,
): string | undefined {
    if (!watchlists || watchlists.length === 0) return undefined;

    let newest: FindingLike | undefined;
    for (const f of findings ?? []) {
        if (!watchlists.some((w) => w.id === f.watchlistId)) continue;
        if (!newest || f.createdAt > newest.createdAt) newest = f;
    }

    return newest?.watchlistId ?? watchlists[0].id;
}
