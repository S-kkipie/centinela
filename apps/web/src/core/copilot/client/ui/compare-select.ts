import type { Finding } from "@/core/finding/domain/types";

const MAX_COMPARE = 3;

/**
 * Resolve the findings the copilot wants compared, from the already-polled
 * feed cache. Only OPORTUNIDAD findings are comparable; ids are honoured in
 * the order the agent asked, deduped, and capped at three side-by-side cards.
 */
export function selectForCompare(
    items: Finding[],
    ids: string[],
): Finding[] {
    const byId = new Map(items.map((f) => [f.id, f]));
    const seen = new Set<string>();
    const out: Finding[] = [];
    for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        const finding = byId.get(id);
        if (finding && finding.kind === "OPORTUNIDAD") out.push(finding);
        if (out.length === MAX_COMPARE) break;
    }
    return out;
}

/** COP amount with a `$` prefix, e.g. `$1.200.000.000`. */
const CUANTIA_SYMBOL = /\$\s?\d[\d.,]*/;
/** Bare amount followed by a COP marker, e.g. `850.000.000 COP`. */
const CUANTIA_SUFFIX = /\d[\d.,]*\s?(?:COP|millones|mil millones)/i;

/**
 * Best-effort monetary figure lifted from a finding summary for the compare
 * card. Gemini writes summaries as prose, so this is a display hint only —
 * null when nothing amount-shaped is present.
 */
export function extractCuantia(summary: string): string | null {
    const symbol = summary.match(CUANTIA_SYMBOL);
    if (symbol) return symbol[0].replace(/\s/g, "");
    const suffix = summary.match(CUANTIA_SUFFIX);
    if (suffix) return suffix[0].trim();
    return null;
}
