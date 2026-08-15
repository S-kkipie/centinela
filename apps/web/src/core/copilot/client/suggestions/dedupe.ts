/**
 * The model happily emits the same question twice with different filler
 * ("¿Por qué es una oportunidad?" / "¿Por qué es oportunidad?"), which reads as
 * two chips offering one thing — and collides as a React key.
 */

/** Words that carry no meaning for telling two questions apart. */
const FILLER = new Set([
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "de",
    "del",
    "este",
    "esta",
    "ese",
    "esa",
]);

/**
 * Crude stem: keep the first 5 letters of long words so conjugations collapse
 * ("resalta"/"resaltar", "muestra"/"muéstrame"). Numbers stay intact — a NIT is
 * the whole point of the question.
 */
function stem(word: string): string {
    if (/\d/.test(word) || word.length <= 5) return word;
    return word.slice(0, 5);
}

function fingerprint(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // strip accents
        .replace(/[^a-z0-9\s]/g, " ") // strip punctuation, ¿ ? included
        .split(/\s+/)
        .filter((w) => w && !FILLER.has(w))
        .map(stem)
        .join(" ");
}

export function dedupeSuggestions(suggestions: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of suggestions) {
        const s = raw.trim();
        if (!s) continue;
        const key = fingerprint(s);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(s);
    }
    return out;
}
