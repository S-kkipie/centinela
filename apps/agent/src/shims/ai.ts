/**
 * Shim for the optional `ai` (Vercel AI SDK) package. The Agents SDK lazily
 * `import("ai")` only inside its chat-agent schema path, which Centinela does not
 * use. Aliasing `ai` to this stub keeps that unused code path from pulling the
 * whole SDK into the Worker bundle. If we ever adopt AiChatAgent, add the real
 * `ai` dependency and drop the alias in wrangler.jsonc.
 */
export function jsonSchema<T>(schema: T): T {
  return schema;
}
