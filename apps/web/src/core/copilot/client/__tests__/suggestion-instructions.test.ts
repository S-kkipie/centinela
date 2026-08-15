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
            hasWatchlists: true,
        });
        expect(out).toMatch(/vigil|frente/i); // "vigilar una entidad" / "el frente"
        expect(out).not.toMatch(/BANDERA_ROJA/);
    });

    it("centres the suggestions on the open red flag", () => {
        const out = buildSuggestionInstructions({
            openFinding: finding,
            watchlistName: "Bogota smoke",
            findingCounts: { oportunidades: 7, banderas: 4 },
            topCounterpartyNit: "900123456",
            hasWatchlists: true,
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
            hasWatchlists: true,
        });
        expect(out).toMatch(/present|gan|compet/i);
    });

    it("always demands short, first-person questions in Spanish", () => {
        const out = buildSuggestionInstructions({
            openFinding: finding,
            watchlistName: "Bogota smoke",
            findingCounts: { oportunidades: 7, banderas: 4 },
            topCounterpartyNit: null,
            hasWatchlists: true,
        });
        expect(out).toMatch(/español|es-CO/i);
        expect(out).toMatch(/cort/i);
    });

    // First run: no frentes yet. The chips must onboard, not offer actions
    // (filter/network/documents) that have nothing to act on.
    it("switches to onboarding prompts when there are no frentes", () => {
        const out = buildSuggestionInstructions({
            openFinding: null,
            watchlistName: null,
            findingCounts: { oportunidades: 0, banderas: 0 },
            topCounterpartyNit: null,
            hasWatchlists: false,
        });
        expect(out).toMatch(/empezar|empi|primer|frente/i);
        expect(out).toMatch(/Alcald|sector|entidad/i);
        // Must not push post-setup actions that dead-end with an empty console.
        expect(out).not.toMatch(/dossier|red de contratistas|derecho de petición/i);
    });

    it("does not onboard once the user opens a finding, even with no frente ctx", () => {
        const out = buildSuggestionInstructions({
            openFinding: finding,
            watchlistName: null,
            findingCounts: { oportunidades: 0, banderas: 1 },
            topCounterpartyNit: null,
            hasWatchlists: false,
        });
        expect(out).toContain(finding.title);
    });
});
