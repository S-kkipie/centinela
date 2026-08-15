import { describe, expect, it } from "vitest";
import type { Tender } from "@centinela/contracts/croma";
import { detectNewTenders, statusHash, type SeenMap } from "../src/detect.ts";

function tender(over: Partial<Tender> = {}): Tender {
  return {
    noticeUid: "CO1.NTC.001",
    entityNit: "899999061",
    entityName: "Alcaldía de Bogotá",
    title: "Suministro de equipos",
    valueCop: 1_000_000,
    status: "convocatoria",
    raw: null,
    ...over,
  };
}

describe("statusHash", () => {
  it("is stable for the same status + value", () => {
    expect(statusHash(tender())).toBe(statusHash(tender()));
  });

  it("changes when status changes (award transition)", () => {
    const open = statusHash(tender({ status: "convocatoria" }));
    const awarded = statusHash(tender({ status: "adjudicado" }));
    expect(open).not.toBe(awarded);
  });

  it("changes when contract value changes", () => {
    const a = statusHash(tender({ valueCop: 1000 }));
    const b = statusHash(tender({ valueCop: 2000 }));
    expect(a).not.toBe(b);
  });

  it("does not throw on missing optional fields", () => {
    expect(() => statusHash(tender({ status: undefined, valueCop: undefined }))).not.toThrow();
  });
});

describe("detectNewTenders", () => {
  it("treats every tender as new against an empty seen map", () => {
    const fetched = [tender({ noticeUid: "A" }), tender({ noticeUid: "B" })];
    const { newTenders, nextSeenMap } = detectNewTenders(fetched, {});
    expect(newTenders.map((t) => t.noticeUid)).toEqual(["A", "B"]);
    expect(Object.keys(nextSeenMap)).toEqual(["A", "B"]);
  });

  it("skips tenders whose uid + status hash are unchanged", () => {
    const fetched = [tender({ noticeUid: "A" })];
    const seen: SeenMap = { A: statusHash(tender({ noticeUid: "A" })) };
    const { newTenders } = detectNewTenders(fetched, seen);
    expect(newTenders).toEqual([]);
  });

  it("re-emits a seen tender when its status changes (draft→awarded)", () => {
    const seen: SeenMap = {
      A: statusHash(tender({ noticeUid: "A", status: "convocatoria" })),
    };
    const fetched = [tender({ noticeUid: "A", status: "adjudicado" })];
    const { newTenders, nextSeenMap } = detectNewTenders(fetched, seen);
    expect(newTenders.map((t) => t.noticeUid)).toEqual(["A"]);
    expect(nextSeenMap.A).toBe(statusHash(tender({ status: "adjudicado" })));
  });

  it("carries forward seen entries not present in this fetch", () => {
    const seen: SeenMap = { OLD: "hash-old" };
    const fetched = [tender({ noticeUid: "NEW" })];
    const { nextSeenMap } = detectNewTenders(fetched, seen);
    expect(nextSeenMap.OLD).toBe("hash-old");
    expect(nextSeenMap.NEW).toBeDefined();
  });

  it("dedupes a uid appearing twice in one batch (last wins, emitted once)", () => {
    const fetched = [
      tender({ noticeUid: "A", status: "convocatoria" }),
      tender({ noticeUid: "A", status: "adjudicado" }),
    ];
    const { newTenders, nextSeenMap } = detectNewTenders(fetched, {});
    expect(newTenders.filter((t) => t.noticeUid === "A")).toHaveLength(1);
    expect(nextSeenMap.A).toBe(statusHash(tender({ status: "adjudicado" })));
  });
});
