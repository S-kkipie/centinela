import { describe, expect, it } from "vitest";
import { dedupeSuggestions } from "@/core/copilot/client/suggestions/dedupe";

describe("dedupeSuggestions", () => {
    it("keeps distinct suggestions in order", () => {
        expect(
            dedupeSuggestions(["¿Por qué es oportunidad?", "¿Quién ganó?"]),
        ).toEqual(["¿Por qué es oportunidad?", "¿Quién ganó?"]);
    });

    // The model produced "¿Por qué es una oportunidad?" and "¿Por qué es
    // oportunidad?" in the same batch — two chips, one question.
    it("drops rewordings that differ only in filler words", () => {
        expect(
            dedupeSuggestions([
                "¿Por qué es una oportunidad?",
                "¿Por qué es oportunidad?",
            ]),
        ).toEqual(["¿Por qué es una oportunidad?"]);
    });

    // Observed live: the model offered "Resalta el NIT X" and "Resaltar NIT X"
    // side by side. Same request, two verb forms.
    it("drops rewordings that differ only in verb ending", () => {
        expect(
            dedupeSuggestions([
                "Resalta el NIT 900123456",
                "Resaltar NIT 900123456",
            ]),
        ).toEqual(["Resalta el NIT 900123456"]);
        expect(
            dedupeSuggestions(["Muéstrame la red", "Muestra la red"]),
        ).toHaveLength(1);
    });

    it("keeps genuinely different questions that share a stem", () => {
        expect(
            dedupeSuggestions([
                "¿Quién ganó el contrato?",
                "¿Quién ganó otros contratos?",
            ]),
        ).toHaveLength(2);
    });

    it("ignores case, accents and punctuation", () => {
        expect(
            dedupeSuggestions([
                "¿Quién ganó el contrato?",
                "quien gano el contrato",
            ]),
        ).toHaveLength(1);
    });

    it("drops empties and trims", () => {
        expect(dedupeSuggestions(["  ", "", "¿Quién ganó?"])).toEqual([
            "¿Quién ganó?",
        ]);
    });
});
