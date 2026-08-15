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

    it("seeds demo suggestion chips in Spanish", () => {
        expect(SEED_SUGGESTIONS.length).toBeGreaterThanOrEqual(3);
        expect(SEED_SUGGESTIONS).toContain(
            "Muéstrame las banderas rojas de esta semana",
        );
    });

    it("exposes es-CO chat labels", () => {
        expect(CHAT_LABELS.title).toBe("Copiloto Centinela");
        expect(CHAT_LABELS.placeholder).toBe("Pregunta por un hallazgo…");
    });
});
