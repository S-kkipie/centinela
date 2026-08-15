import { describe, expect, it } from "vitest";
import {
    CHAT_LABELS,
    COPILOT_AGENT_ID,
    COPILOT_MODEL,
    SEED_SUGGESTIONS,
    SYSTEM_PROMPT,
} from "../config";

describe("copilot config", () => {
    it("binds to the runtime default agent id", () => {
        // Must match @copilotkit shared DEFAULT_AGENT_ID so useAgent() resolves.
        expect(COPILOT_AGENT_ID).toBe("default");
    });

    it("uses the Gemini flash model in provider/slash form", () => {
        // BuiltInAgentModel accepts "provider/model", not "provider:model".
        expect(COPILOT_MODEL).toBe("google/gemini-2.5-flash");
    });

    it("has an es-CO analyst system prompt that demands grounded claims", () => {
        expect(SYSTEM_PROMPT).toMatch(/analista/i);
        expect(SYSTEM_PROMPT).toMatch(/contrataci[oó]n p[uú]blica/i);
        // Must instruct grounding in provided evidence/context.
        expect(SYSTEM_PROMPT).toMatch(/evidencia|contexto/i);
    });

    // The cold-start chips are the user's first impression of what the copilot
    // is for: at least one has to ask it to DO something, not explain something.
    it("seeds demo suggestion chips in Spanish", () => {
        expect(SEED_SUGGESTIONS.length).toBeGreaterThanOrEqual(3);
        expect(
            SEED_SUGGESTIONS.some((s) => /red|dossier|patr[oó]n|gana/i.test(s)),
        ).toBe(true);
    });

    it("tells the model it can open the network and produce documents", () => {
        expect(SYSTEM_PROMPT).toMatch(/openNetwork/);
        expect(SYSTEM_PROMPT).toMatch(/patternScan/);
        expect(SYSTEM_PROMPT).toMatch(/exportDossier/);
        expect(SYSTEM_PROMPT).toMatch(/draftDenuncia/);
        // Legal drafts must never be presented as final.
        expect(SYSTEM_PROMPT).toMatch(/borrador/i);
    });

    it("exposes es-CO chat labels", () => {
        expect(CHAT_LABELS.title).toBe("Copiloto Centinela");
        expect(CHAT_LABELS.placeholder).toBe("Pregunta por un hallazgo…");
    });
});
