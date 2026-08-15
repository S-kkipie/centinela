import { describe, expect, it } from "vitest";
import type { ProviderContract } from "@centinela/contracts/croma";
import {
  contractsToTenders,
  contractTenderId,
  unwatchedEntities,
} from "../src/contractor.ts";

const contractor = { nit: "900111", name: "Constructora X" };

function contract(over: Partial<ProviderContract> = {}): ProviderContract {
  return {
    contractId: "CO1.CT.1",
    entityNit: "899999061",
    entityName: "Alcaldía de Medellín",
    valueCop: 1_200_000_000,
    awardedAt: "2026-08-10",
    raw: { source: "test" },
    ...over,
  };
}

describe("contractTenderId", () => {
  it("prefers the notice uid when the payload carries one", () => {
    expect(contractTenderId(contract({ noticeUid: "CO1.NTC.9" }))).toBe(
      "CO1.NTC.9",
    );
  });

  // Losing the award because the endpoint omitted a notice uid would defeat the
  // point of following a contractor.
  it("falls back to the contract id", () => {
    expect(contractTenderId(contract())).toBe("CO1.CT.1");
  });
});

describe("contractsToTenders", () => {
  it("maps a contract onto the tender shape the pipeline speaks", () => {
    const [tender] = contractsToTenders(
      [contract({ noticeUid: "CO1.NTC.9" })],
      contractor,
    );
    expect(tender).toMatchObject({
      noticeUid: "CO1.NTC.9",
      entityNit: "899999061",
      entityName: "Alcaldía de Medellín",
      valueCop: 1_200_000_000,
      status: "adjudicado",
      publishedAt: "2026-08-10",
    });
    expect(tender.title).toContain("Constructora X");
    expect(tender.title).toContain("Alcaldía de Medellín");
  });

  it("falls back to the NIT when the entity has no published name", () => {
    const [tender] = contractsToTenders(
      [contract({ entityName: undefined })],
      contractor,
    );
    expect(tender.entityName).toBe("899999061");
  });

  it("omits optional fields the payload does not carry", () => {
    const [tender] = contractsToTenders(
      [contract({ valueCop: undefined, awardedAt: undefined })],
      contractor,
    );
    expect(tender).not.toHaveProperty("valueCop");
    expect(tender).not.toHaveProperty("publishedAt");
  });

  it("dedups repeated ids within one sweep", () => {
    const tenders = contractsToTenders(
      [
        contract({ contractId: "CO1.CT.1" }),
        contract({ contractId: "CO1.CT.1", valueCop: 999 }),
        contract({ contractId: "CO1.CT.2" }),
      ],
      contractor,
    );
    expect(tenders).toHaveLength(2);
    // Last occurrence wins, matching detectNewTenders' own collapse rule.
    expect(tenders[0].valueCop).toBe(999);
  });

  it("skips a row with no usable id", () => {
    expect(
      contractsToTenders([contract({ contractId: "" })], contractor),
    ).toHaveLength(0);
  });

  it("handles an empty sweep", () => {
    expect(contractsToTenders([], contractor)).toEqual([]);
  });
});

describe("unwatchedEntities", () => {
  const tenders = contractsToTenders(
    [
      contract({ contractId: "a", entityNit: "899999061" }),
      contract({ contractId: "b", entityNit: "800000002", entityName: "EPM" }),
      contract({ contractId: "c", entityNit: "800000002", entityName: "EPM" }),
    ],
    contractor,
  );

  // This is the payoff: awards in entities the user never watched, and could
  // not have afforded to watch.
  it("reports entities outside the watched set, busiest first", () => {
    expect(unwatchedEntities(tenders, new Set(["899999061"]))).toEqual([
      { nit: "800000002", name: "EPM", awards: 2 },
    ]);
  });

  it("returns nothing when everything is already watched", () => {
    expect(
      unwatchedEntities(tenders, new Set(["899999061", "800000002"])),
    ).toEqual([]);
  });
});
