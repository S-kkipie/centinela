import { describe, expect, it } from "vitest";
import { createCromaClient } from "../src/index.ts";

/**
 * Hits the real Croma API. Gated behind `CROMA_LIVE=1` (and a key) so it never
 * runs in CI by accident: `pnpm -F @centinela/croma test:live`.
 */
const live = process.env.CROMA_LIVE === "1" && !!process.env.CROMA_API_KEY;

describe.skipIf(!live)("live Croma API", () => {
  const client = createCromaClient({ apiKey: process.env.CROMA_API_KEY as string });

  it("sweeps real tenders for a known entity (ALCALDIA LOCAL DE ENGATIVÁ)", async () => {
    const tenders = await client.secopProcessesByEntity("899999061", { from: "2026-01-01" });
    expect(tenders.length).toBeGreaterThan(0);
    const t = tenders[0];
    expect(t.noticeUid).toMatch(/^CO1\.NTC\./);
    expect(t.entityNit).toBe("899999061");
    expect(typeof t.title).toBe("string");
    expect(t.raw).toBeDefined();
  });
});
