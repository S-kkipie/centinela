/**
 * `render` receives the tool's output already serialized, so a handler that
 * returned `{ finding }` arrives as a JSON string. Reading it as an object
 * silently falls through to the error branch.
 */
export function parseToolResult<T extends Record<string, unknown>>(
    result: unknown,
): (Partial<T> & { error?: string }) | null {
    if (result == null) return null;
    if (typeof result === "string") {
        try {
            return JSON.parse(result);
        } catch {
            // Plain-text output (a status line, not a payload).
            return { error: result } as Partial<T> & { error: string };
        }
    }
    return result as Partial<T> & { error?: string };
}
