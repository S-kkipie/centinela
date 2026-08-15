/**
 * Award-concentration analysis over the contractor network.
 *
 * This is the finding no human reads off a tender list: one entity awarding
 * again and again to the same NIT, or two "competing" winners sharing a legal
 * representative. Both are already in the graph the agent built — nobody was
 * computing them.
 *
 * Pure and direction-agnostic: `graphEdges` carry no guaranteed orientation, so
 * every rule here reads an edge as an unordered pair and uses the watched
 * entities (the hubs by construction) to decide which endpoint is the winner.
 */

export type ConcentrationEdge = {
    fromNit: string;
    toNit: string;
    relation: string;
    findingId?: string | null;
};

export type CounterpartyStat = {
    nit: string;
    /** Contracts this NIT won from the watched entities. */
    awards: number;
    /** Share of all awards in the network, 0–1. */
    share: number;
    /** Touched by at least one BANDERA_ROJA finding. */
    flagged: boolean;
};

export type SharedRepresentative = {
    /** The person/NIT sitting on both sides. */
    nit: string;
    /** The award-winning NITs it is tied to. */
    represents: string[];
};

export type ConcentrationReport = {
    totalAwards: number;
    distinctWinners: number;
    /** Highest-award counterparties first, capped. */
    top: CounterpartyStat[];
    /**
     * Herfindahl–Hirschman index over award shares, 0–1. 1 = a single winner
     * takes every contract; ~0 = evenly spread. Above 0.25 is "concentrated"
     * by the usual antitrust reading.
     */
    hhi: number;
    /** Distinct winners tied together by a shared representative. */
    sharedRepresentatives: SharedRepresentative[];
    /** True when the numbers are worth surfacing unprompted. */
    notable: boolean;
};

const AWARD_RELATION = "adjudicatario";
const REPRESENTATIVE_RELATION = "representante_legal";
const MAX_TOP = 5;

/** Concentrated enough that the copilot should say so without being asked. */
export const HHI_NOTABLE = 0.25;
/** One counterparty holding this share of awards is a story on its own. */
export const SHARE_NOTABLE = 0.5;
/** Below this an award count is too thin for any share to mean anything. */
export const MIN_AWARDS = 3;

/**
 * The endpoint of an award edge that is NOT a watched entity. Watched entities
 * are the contracting side, so whatever is left is the winner. With neither (or
 * both) endpoint watched, fall back to `toNit`.
 */
function winnerOf(edge: ConcentrationEdge, watched: Set<string>): string {
    const fromWatched = watched.has(edge.fromNit);
    const toWatched = watched.has(edge.toNit);
    if (fromWatched && !toWatched) return edge.toNit;
    if (toWatched && !fromWatched) return edge.fromNit;
    return edge.toNit;
}

export function analyzeConcentration(
    edges: ConcentrationEdge[],
    opts: {
        /** NITs of the contracting entities the user watches. */
        watchedNits?: Set<string>;
        flaggedFindingIds?: Set<string>;
    } = {},
): ConcentrationReport {
    const watched = opts.watchedNits ?? new Set<string>();
    const flaggedFindings = opts.flaggedFindingIds ?? new Set<string>();

    const awards = new Map<string, number>();
    const flagged = new Set<string>();
    // NIT -> the other endpoints it is a representative of.
    const repLinks = new Map<string, Set<string>>();

    for (const e of edges) {
        const isFlagged = Boolean(
            e.findingId && flaggedFindings.has(e.findingId),
        );
        if (isFlagged) {
            flagged.add(e.fromNit);
            flagged.add(e.toNit);
        }
        if (e.relation === AWARD_RELATION) {
            const winner = winnerOf(e, watched);
            awards.set(winner, (awards.get(winner) ?? 0) + 1);
        } else if (e.relation === REPRESENTATIVE_RELATION) {
            for (const [a, b] of [
                [e.fromNit, e.toNit],
                [e.toNit, e.fromNit],
            ] as const) {
                const set = repLinks.get(a) ?? new Set<string>();
                set.add(b);
                repLinks.set(a, set);
            }
        }
    }

    const totalAwards = [...awards.values()].reduce((a, b) => a + b, 0);
    const top: CounterpartyStat[] = [...awards.entries()]
        .map(([nit, count]) => ({
            nit,
            awards: count,
            share: totalAwards > 0 ? count / totalAwards : 0,
            flagged: flagged.has(nit),
        }))
        .sort((a, b) => b.awards - a.awards || a.nit.localeCompare(b.nit));

    const hhi = top.reduce((sum, c) => sum + c.share * c.share, 0);

    // A representative only matters when it ties together two or more NITs that
    // actually won something — otherwise it is ordinary corporate paperwork.
    const sharedRepresentatives: SharedRepresentative[] = [];
    for (const [nit, links] of repLinks) {
        if (awards.has(nit)) continue; // the winner side of its own edge
        const winners = [...links].filter((n) => awards.has(n)).sort();
        if (winners.length >= 2)
            sharedRepresentatives.push({ nit, represents: winners });
    }
    sharedRepresentatives.sort(
        (a, b) =>
            b.represents.length - a.represents.length ||
            a.nit.localeCompare(b.nit),
    );

    const leader = top[0];
    const notable =
        sharedRepresentatives.length > 0 ||
        (totalAwards >= MIN_AWARDS &&
            (hhi >= HHI_NOTABLE ||
                (leader != null && leader.share >= SHARE_NOTABLE)));

    return {
        totalAwards,
        distinctWinners: awards.size,
        top: top.slice(0, MAX_TOP),
        hhi,
        sharedRepresentatives,
        notable,
    };
}

/** One-line es-CO verdict for the chat and the activity ticker. */
export function describeConcentration(report: ConcentrationReport): string {
    if (report.totalAwards === 0)
        return "La red todavía no registra adjudicaciones.";

    const parts: string[] = [];
    const leader = report.top[0];
    if (leader) {
        const pct = Math.round(leader.share * 100);
        parts.push(
            `${leader.nit} concentra ${leader.awards} de ${report.totalAwards} adjudicaciones (${pct}%) entre ${report.distinctWinners} ${report.distinctWinners === 1 ? "adjudicatario" : "adjudicatarios"}.`,
        );
    }
    if (report.sharedRepresentatives.length > 0) {
        const s = report.sharedRepresentatives[0];
        parts.push(
            `${s.nit} figura como representante de ${s.represents.length} adjudicatarios distintos (${s.represents.join(", ")}).`,
        );
    }
    parts.push(
        report.hhi >= HHI_NOTABLE
            ? `Índice de concentración HHI ${report.hhi.toFixed(2)}: mercado concentrado.`
            : `Índice de concentración HHI ${report.hhi.toFixed(2)}: reparto disperso.`,
    );
    return parts.join(" ");
}
