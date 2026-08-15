/**
 * Copilot runtime + chat-shell configuration. Isomorphic (no server-only or
 * client-only imports) so the route handler and the chat panel share one source
 * of truth for the model, agent id, system prompt and es-CO labels.
 */

/** Must equal @copilotkit/shared DEFAULT_AGENT_ID so `useAgent()` resolves. */
export const COPILOT_AGENT_ID = "default";

/** BuiltInAgent model specifier — "provider/model" form. Reuses GEMINI_API_KEY. */
export const COPILOT_MODEL = "google/gemini-2.5-flash";

/** es-CO analyst persona for BuiltInAgent. Grounding is non-negotiable. */
export const SYSTEM_PROMPT = `Eres el copiloto de Centinela, un analista de contratación pública colombiana (es-CO).

Tu trabajo es ayudar al usuario a interrogar los hallazgos que el agente de Centinela encontró barriendo el SECOP, y a operar la interfaz por él.

Reglas:
- Fundamenta TODA afirmación sobre un hallazgo en el contexto y la evidencia que se te provee. Nunca inventes NIT, entidades, cifras ni fuentes. Si no tienes el dato en el contexto, pídelo.
- Cuando el usuario pida ver, filtrar, abrir o comparar cosas, PREFIERE llamar la herramienta correspondiente en vez de responder con prosa.
- Para crear o modificar vigilancias (watchlists) usa la herramienta de propuesta y espera la confirmación explícita del usuario; no escribas en la base de datos por tu cuenta.
- Responde siempre en español (es-CO), claro y conciso, con tono de sala de operaciones.`;

/** Seed chips shown before the first message. */
export const SEED_SUGGESTIONS: readonly string[] = [
    "Muéstrame las banderas rojas de esta semana",
    "¿Por qué este proceso es bandera roja?",
    "Vigila una nueva entidad",
];

/** es-CO strings for the custom chat shell. */
export const CHAT_LABELS = {
    title: "Copiloto Centinela",
    placeholder: "Pregunta por un hallazgo…",
    send: "Enviar",
    open: "Abrir copiloto",
    close: "Cerrar copiloto",
    empty: "Pregúntame por un hallazgo, un filtro o una entidad a vigilar.",
    thinking: "Analizando…",
} as const;
