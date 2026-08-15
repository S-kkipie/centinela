/**
 * Per-node metadata for the contractor graph, so a NIT stops being an opaque
 * number: what it is (watched entity, adjudicatario, legal rep), how connected
 * it is, whether a red flag touches it, and who it links to.
 *
 * Pure and direction-agnostic — graph edges carry no guaranteed orientation, so
 * the watched set (the contracting entities) decides which endpoint of an award
 * is the winner.
 */

export type GraphEdgeLike = {
    fromNit: string;
    toNit: string;
    relation: string;
    findingId?: string | null;
};

export type NodeRole =
    | "vigilada"
    | "adjudicatario"
    | "representante"
    | "contraparte";

export type NodeLink = {
    /** The NIT on the other end. */
    nit: string;
    name?: string;
    relation: string;
};

export type NodeMeta = {
    nit: string;
    name?: string;
    role: NodeRole;
    /** Number of edges touching this NIT. */
    degree: number;
    /** Touched by at least one BANDERA_ROJA finding. */
    flagged: boolean;
    /** The NITs it connects to, with the relation. */
    links: NodeLink[];
};

const AWARD = "adjudicatario";
const REPRESENTATIVE = "representante_legal";

export const ROLE_LABEL: Record<NodeRole, string> = {
    vigilada: "Entidad vigilada",
    adjudicatario: "Adjudicatario",
    representante: "Representante legal",
    contraparte: "Contraparte",
};

export function buildNodeMeta(
    edges: readonly GraphEdgeLike[],
    opts: {
        flaggedFindingIds?: ReadonlySet<string>;
        /** NIT → display name (from watchlist entities and findings). */
        nameByNit?: Readonly<Record<string, string>>;
        /** NITs of the contracting entities the user watches. */
        watchedNits?: ReadonlySet<string>;
    } = {},
): Map<string, NodeMeta> {
    const flaggedFindings = opts.flaggedFindingIds ?? new Set<string>();
    const names = opts.nameByNit ?? {};
    const watched = opts.watchedNits ?? new Set<string>();

    const meta = new Map<string, NodeMeta>();
    const ensure = (nit: string): NodeMeta => {
        let m = meta.get(nit);
        if (!m) {
            m = {
                nit,
                ...(names[nit] ? { name: names[nit] } : {}),
                role: watched.has(nit) ? "vigilada" : "contraparte",
                degree: 0,
                flagged: false,
                links: [],
            };
            meta.set(nit, m);
        }
        return m;
    };

    for (const e of edges) {
        const a = ensure(e.fromNit);
        const b = ensure(e.toNit);
        a.degree++;
        b.degree++;

        const isFlagged = Boolean(
            e.findingId && flaggedFindings.has(e.findingId),
        );
        if (isFlagged) {
            a.flagged = true;
            b.flagged = true;
        }

        // Link both directions, deduped by (counterpart, relation).
        pushLink(a, { nit: b.nit, name: b.name, relation: e.relation });
        pushLink(b, { nit: a.nit, name: a.name, relation: e.relation });

        // Role: don't override a watched entity. On an award, the winner is the
        // endpoint that is NOT watched; a representative sits on any rep edge.
        if (e.relation === AWARD) {
            if (!watched.has(a.nit) && a.role === "contraparte")
                a.role = "adjudicatario";
            if (!watched.has(b.nit) && b.role === "contraparte")
                b.role = "adjudicatario";
        } else if (e.relation === REPRESENTATIVE) {
            if (a.role === "contraparte") a.role = "representante";
            if (b.role === "contraparte") b.role = "representante";
        }
    }

    return meta;
}

function pushLink(node: NodeMeta, link: NodeLink): void {
    if (
        node.links.some(
            (l) => l.nit === link.nit && l.relation === link.relation,
        )
    )
        return;
    node.links.push(link);
}

/** One-line "what is this" for a hover tooltip. */
export function describeNode(m: NodeMeta): string {
    const who = m.name ? `${m.name} (NIT ${m.nit})` : `NIT ${m.nit}`;
    const conns = `${m.degree} ${m.degree === 1 ? "conexión" : "conexiones"}`;
    const flag = m.flagged ? " · en bandera roja" : "";
    return `${ROLE_LABEL[m.role]} · ${who} · ${conns}${flag}`;
}
