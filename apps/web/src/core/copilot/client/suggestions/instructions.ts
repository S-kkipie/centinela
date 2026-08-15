/**
 * Builds the prompt that generates the chat's suggestion chips. It is rebuilt
 * as the user moves through the console — open a finding and the next questions
 * should be about that finding, not generic ones.
 */

import type { FindingKind } from "@/core/finding/domain/types";

export type SuggestionContext = {
    openFinding: {
        id: string;
        title: string;
        entityName: string;
        kind: FindingKind;
        score: number;
    } | null;
    watchlistName: string | null;
    findingCounts: { oportunidades: number; banderas: number };
    topCounterpartyNit: string | null;
};

const BASE =
    "Genera preguntas que el usuario le haría al copiloto de Centinela sobre contratación pública. " +
    "Escríbelas en español (es-CO), en primera persona, cortas (máximo 8 palabras) y accionables. " +
    "Cada una debe poder responderse con el contexto o las herramientas disponibles. " +
    "Cada sugerencia debe atacar un ángulo DISTINTO (evidencia, adjudicatario, red de contratistas, comparación, siguiente acción): " +
    "no reformules la misma pregunta con otras palabras.";

export function buildSuggestionInstructions(ctx: SuggestionContext): string {
    const parts = [BASE];

    if (ctx.watchlistName) {
        parts.push(
            `El usuario mira la vigilada "${ctx.watchlistName}": ${ctx.findingCounts.banderas} banderas rojas y ${ctx.findingCounts.oportunidades} oportunidades.`,
        );
    }

    if (ctx.openFinding) {
        const f = ctx.openFinding;
        parts.push(
            `Tiene abierto el hallazgo "${f.title}" (${f.kind}, score ${f.score}) de ${f.entityName}.`,
        );
        parts.push(
            f.kind === "BANDERA_ROJA"
                ? "Enfoca las sugerencias en entender el riesgo: la evidencia que lo sustenta, quién es el adjudicatario y con quién está conectado en la red."
                : "Enfoca las sugerencias en ganarlo: qué tan competido está, cómo se compara con otras oportunidades abiertas y qué se necesita para presentarse.",
        );
    } else {
        parts.push(
            "No hay ningún hallazgo abierto: sugiere revisar las banderas rojas del periodo, comparar oportunidades o vigilar una entidad nueva.",
        );
    }

    if (ctx.topCounterpartyNit) {
        parts.push(
            `En la red, el NIT más conectado que no es la entidad vigilada es ${ctx.topCounterpartyNit}; puede dar pie a una pregunta sobre sus vínculos.`,
        );
    }

    return parts.join(" ");
}
