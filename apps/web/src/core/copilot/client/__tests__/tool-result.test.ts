import { describe, expect, it } from "vitest";
import { parseToolResult } from "@/core/copilot/client/tools/tool-result";

describe("parseToolResult", () => {
    it("returns null before the tool has produced a result", () => {
        expect(parseToolResult(undefined)).toBeNull();
        expect(parseToolResult(null)).toBeNull();
    });

    // CopilotKit hands `render` the serialized tool output, not the object the
    // handler returned — treating it as an object made every card show the
    // error branch even when the lookup succeeded.
    it("parses the JSON string CopilotKit passes to render", () => {
        const payload = { finding: { id: "f-1", title: "Adjudicación" } };
        expect(parseToolResult(JSON.stringify(payload))).toEqual(payload);
    });

    it("still accepts an already-parsed object", () => {
        const payload = { finding: { id: "f-1" } };
        expect(parseToolResult(payload)).toEqual(payload);
    });

    it("surfaces the handler's error field", () => {
        expect(
            parseToolResult(
                JSON.stringify({ error: "hallazgo no encontrado" }),
            ),
        ).toEqual({ error: "hallazgo no encontrado" });
    });

    it("treats non-JSON text as an error message", () => {
        expect(parseToolResult("Abriendo: Adjudicación")).toEqual({
            error: "Abriendo: Adjudicación",
        });
    });
});
