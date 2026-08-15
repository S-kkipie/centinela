import { describe, expect, it } from "vitest";
import { matchesAgentKey } from "../agent-key";

const KEY = "test-agent-ingest-key-1234567890";

describe("matchesAgentKey", () => {
    it("returns true when the provided key matches", () => {
        expect(matchesAgentKey(KEY, KEY)).toBe(true);
    });

    it("returns false when the provided key differs", () => {
        expect(matchesAgentKey("wrong-key", KEY)).toBe(false);
    });

    it("returns false for a null header", () => {
        expect(matchesAgentKey(null, KEY)).toBe(false);
    });

    it("returns false for an empty provided key", () => {
        expect(matchesAgentKey("", KEY)).toBe(false);
    });

    it("returns false when lengths differ (no partial match)", () => {
        expect(matchesAgentKey(KEY.slice(0, 10), KEY)).toBe(false);
    });
});
