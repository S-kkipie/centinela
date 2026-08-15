/**
 * Fuzzy name→entity search over the starter catalog.
 *
 * Pure and accent-insensitive: a user types "bogota" or "Alcaldía de Bogotá"
 * and gets the same hit. Ranking favors exact/prefix matches and full-token
 * coverage so "cali" doesn't lose to a longer partial match.
 */

import {
    type CatalogEntity,
    ENTITY_CATALOG,
} from "@/core/copilot/client/data/entity-catalog";

/** Lowercase, strip accents/punctuation, collapse whitespace. */
export function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export type EntityMatch = CatalogEntity & { score: number };

/** Connectives that must never carry a match on their own. */
const STOPWORDS = new Set([
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
    "y",
    "d",
    "c",
    "en",
]);

/** All searchable text for an entity, normalized. */
function haystack(e: CatalogEntity): string {
    return normalize([e.name, ...e.aliases, e.sector].join(" "));
}

/**
 * Score one entity against a normalized query. 0 = no match. Higher is better:
 * exact alias/name > prefix > all query tokens present > some tokens present.
 */
function scoreEntity(e: CatalogEntity, q: string): number {
    if (!q) return 0;
    // A bare NIT query matches its entity outright.
    if (q === e.nit) return 100;
    const hay = haystack(e);
    const name = normalize(e.name);
    const aliases = e.aliases.map(normalize);

    if (name === q || aliases.includes(q)) return 90;
    if (name.startsWith(q) || aliases.some((a) => a.startsWith(q))) return 70;

    // Stopwords ("de", "la"…) appear in almost every name — matching on them
    // alone would make "ministerio de hacienda" hit "Alcaldía de Bogotá".
    const tokens = q.split(" ").filter((t) => t && !STOPWORDS.has(t));
    if (tokens.length === 0) return 0;
    const present = tokens.filter((t) => hay.includes(t));
    if (present.length === 0) return 0;
    // Full coverage beats partial; longer matched tokens weigh a little more.
    const coverage = present.length / tokens.length;
    const matchedChars = present.join("").length;
    return Math.round(coverage * 50 + Math.min(matchedChars, 15));
}

/**
 * Ranked catalog matches for a query. Returns at most `limit`, best first,
 * dropping zero-score entries. A raw NIT that isn't in the catalog returns
 * empty — the caller should fall back to `verifyEntity`.
 */
export function searchEntities(
    query: string,
    limit = 5,
    catalog: readonly CatalogEntity[] = ENTITY_CATALOG,
): EntityMatch[] {
    const q = normalize(query);
    return catalog
        .map((e) => ({ ...e, score: scoreEntity(e, q) }))
        .filter((e) => e.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, limit);
}

/** Entities in a sector, for "muéstrame entidades de salud". */
export function entitiesBySector(
    sector: string,
    catalog: readonly CatalogEntity[] = ENTITY_CATALOG,
): CatalogEntity[] {
    const s = normalize(sector);
    return catalog.filter((e) => normalize(e.sector).includes(s));
}

/** A string that is just a Colombian NIT/document (digits, optional -DV). */
export function looksLikeNit(text: string): boolean {
    return /^\d{5,15}(-?\d)?$/.test(text.trim());
}
