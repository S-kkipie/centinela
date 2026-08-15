import { describe, expect, it } from "vitest";
import { buildSuggestionInstructions } from "@/core/copilot/client/suggestions/instructions";

const finding = {
    id: "f-1",
    title: "Adjudicacion a proveedor con matricula mercantil cancelada",
    entityName: "ALCALDIA LOCAL DE ENGATIVÁ",
    kind: "BANDERA_ROJA" as const,
    score: 85,
};

describe("buildSuggestionInstructions", () => {
    it("asks about watching entities when there is nothing to look at", () => {
        const out = buildSuggestionInstructions({
            openFinding: null,
            watchlistName: null,
            findingCounts: { oportunidades: 0, banderas: 0 },
            topCounterpartyNit: null,
        });
        expect(out).toMatch(/vigil/i); // "vigilar una entidad" / "la vigilada"
        expect(out).not.toMatch(/BANDERA_ROJA/);
    });

    it("centres the suggestions on the open red flag", () => {
        const out = buildSuggestionInstructions({
            openFinding: finding,
            watchlistName: "Bogota smoke",
            findingCounts: { oportunidades: 7, banderas: 4 },
            topCounterpartyNit: "900123456",
        });
        expect(out).toContain(finding.title);
        expect(out).toContain("BANDERA_ROJA");
        expect(out).toContain("ALCALDIA LOCAL DE ENGATIVÁ");
        expect(out).toContain("900123456");
        expect(out).toContain("Bogota smoke");
    });

    it("frames an open opportunity as something to win, not to investigate", () => {
        const out = buildSuggestionInstructions({
            openFinding: { ...finding, kind: "OPORTUNIDAD", score: 85 },
            watchlistName: "Bogota smoke",
            findingCounts: { oportunidades: 7, banderas: 4 },
            topCounterpartyNit: null,
        });
        expect(out).toMatch(/present|gan|compet/i);
    });

    it("always demands short, first-person questions in Spanish", () => {
        const out = buildSuggestionInstructions({
            openFinding: finding,
            watchlistName: "Bogota smoke",
            findingCounts: { oportunidades: 7, banderas: 4 },
            topCounterpartyNit: null,
        });
        expect(out).toMatch(/español|es-CO/i);
        expect(out).toMatch(/cort/i);
    });
});
