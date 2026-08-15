/**
 * The opening briefing — what the copilot says before it is asked anything.
 *
 * A copilot that waits for a prompt is a chat box, not an agent. On arrival the
 * user should be told what changed while they were gone and be given one thing
 * to do about it. Composed deterministically from the feed the dashboard
 * already polled: no model call, so it cannot hallucinate a finding and cannot
 * be late.
 */

import type { FindingKind } from "@/core/finding/domain/types";

export type BriefingFinding = {
    id: string;
    title: string;
    entityName: string;
    kind: FindingKind;
    score: number;
    createdAt: string;
};

export type BriefingInput = {
    findings: BriefingFinding[];
    /** Names of the watchlists the agent is sweeping. */
    watchlistNames: string[];
    /** ISO of the user's last visit; null on a first visit. */
    lastSeenAt: string | null;
    now: Date;
};

/** Suggested next step, wired to a real tool by the caller. */
export type BriefingAction =
    | { kind: "openFinding"; findingId: string; label: string }
    | { kind: "createWatchlist"; label: string }
    | null;

export type Briefing = {
    /** First line of the message: the state of the world in one sentence. */
    headline: string;
    /** Supporting lines, already ordered. */
    lines: string[];
    action: BriefingAction;
};

/** Below this a red flag is not worth interrupting anyone over. */
export const ALERT_SCORE = 70;

function plural(n: number, one: string, many: string): string {
    return `${n} ${n === 1 ? one : many}`;
}

/** Highest-scoring red flag, ties broken by recency. */
export function topRedFlag<T extends BriefingFinding>(items: T[]): T | null {
    const reds = items.filter((f) => f.kind === "BANDERA_ROJA");
    if (reds.length === 0) return null;
    return reds.reduce((best, f) =>
        f.score > best.score ||
        (f.score === best.score && f.createdAt > best.createdAt)
            ? f
            : best,
    );
}

export function composeBriefing(input: BriefingInput): Briefing {
    const { findings, watchlistNames, lastSeenAt } = input;

    if (watchlistNames.length === 0) {
        // First-run onboarding: the console is empty because the agent has
        // nothing to sweep yet. Guide the user to the one action that starts
        // everything — naming an entity — and make clear they don't need a NIT.
        return {
            headline: "Soy tu copiloto de contratación pública. Empecemos.",
            lines: [
                "Un FRENTE es un grupo de entidades o contratistas que vigilo por ti. Sin uno, no hay nada que barrer — por eso la consola está vacía.",
                "No necesitas saber NITs: dime un nombre (por ejemplo “Alcaldía de Bogotá” o “entidades de salud”) y yo busco el NIT, lo confirmo contigo y creo tu primer frente.",
            ],
            action: {
                kind: "createWatchlist",
                label: "Vigilar la Alcaldía de Bogotá",
            },
        };
    }

    const frentes = plural(watchlistNames.length, "frente", "frentes");

    if (findings.length === 0) {
        return {
            headline: `Barro ${frentes} y todavía no hay hallazgos.`,
            lines: [
                "El próximo barrido publicará aquí lo que encuentre. No tienes que refrescar.",
            ],
            action: null,
        };
    }

    const banderas = findings.filter((f) => f.kind === "BANDERA_ROJA");
    const oportunidades = findings.length - banderas.length;
    const cutoff = lastSeenAt ? new Date(lastSeenAt).getTime() : null;
    const fresh =
        cutoff == null
            ? []
            : findings.filter((f) => new Date(f.createdAt).getTime() > cutoff);

    const headline = `Barro ${frentes}: ${plural(banderas.length, "bandera roja", "banderas rojas")} y ${plural(oportunidades, "oportunidad", "oportunidades")} en el Panel.`;

    const lines: string[] = [];
    if (cutoff == null) {
        lines.push(
            "Es tu primera visita, así que te muestro todo lo que el agente lleva acumulado.",
        );
    } else if (fresh.length === 0) {
        lines.push("Nada nuevo desde tu última visita.");
    } else {
        const freshReds = fresh.filter((f) => f.kind === "BANDERA_ROJA").length;
        lines.push(
            freshReds > 0
                ? `${plural(fresh.length, "hallazgo nuevo", "hallazgos nuevos")} desde tu última visita, ${freshReds} de ellos bandera roja.`
                : `${plural(fresh.length, "hallazgo nuevo", "hallazgos nuevos")} desde tu última visita, ninguno bandera roja.`,
        );
    }

    // Lead with the worst thing on the board — that is what the user came for.
    const worst = topRedFlag(findings);
    if (worst && worst.score >= ALERT_SCORE) {
        lines.push(
            `Lo más grave: "${worst.title}" en ${worst.entityName}, score ${worst.score}.`,
        );
        return {
            headline,
            lines,
            action: {
                kind: "openFinding",
                findingId: worst.id,
                label: "Abrir el informe",
            },
        };
    }

    if (worst) {
        lines.push(
            `La bandera roja más alta está en ${worst.score}: nada urgente.`,
        );
        return {
            headline,
            lines,
            action: {
                kind: "openFinding",
                findingId: worst.id,
                label: "Abrir el informe",
            },
        };
    }

    lines.push("Ninguna bandera roja: todo lo abierto es oportunidad.");
    return { headline, lines, action: null };
}

/** The briefing as the single chat message the copilot posts on arrival. */
export function briefingToMessage(briefing: Briefing): string {
    return [briefing.headline, ...briefing.lines].join("\n");
}
