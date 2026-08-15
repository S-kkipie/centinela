import { describe, expect, it } from "vitest";
import {
    compareOpportunitiesParams,
    focusNodeParams,
    traceRelationParams,
} from "@/core/copilot/client/tools/tool-params";

describe("focusNodeParams", () => {
    it("accepts a NIT", () => {
        expect(focusNodeParams.parse({ nit: "890905211" })).toEqual({
            nit: "890905211",
        });
    });

    it("rejects an empty NIT", () => {
        expect(focusNodeParams.safeParse({ nit: "" }).success).toBe(false);
    });

    it("rejects a missing NIT", () => {
        expect(focusNodeParams.safeParse({}).success).toBe(false);
    });
});

describe("traceRelationParams", () => {
    it("accepts two NITs", () => {
        expect(
            traceRelationParams.parse({ fromNit: "800", toNit: "900" }),
        ).toEqual({ fromNit: "800", toNit: "900" });
    });

    it("rejects when a NIT is empty", () => {
        expect(
            traceRelationParams.safeParse({ fromNit: "800", toNit: "" })
                .success,
        ).toBe(false);
    });
});

describe("compareOpportunitiesParams", () => {
    it("accepts two ids", () => {
        expect(
            compareOpportunitiesParams.parse({ findingIds: ["a", "b"] })
                .findingIds,
        ).toEqual(["a", "b"]);
    });

    it("accepts three ids", () => {
        expect(
            compareOpportunitiesParams.safeParse({
                findingIds: ["a", "b", "c"],
            }).success,
        ).toBe(true);
    });

    it("rejects a single id", () => {
        expect(
            compareOpportunitiesParams.safeParse({ findingIds: ["a"] }).success,
        ).toBe(false);
    });

    it("rejects more than three ids", () => {
        expect(
            compareOpportunitiesParams.safeParse({
                findingIds: ["a", "b", "c", "d"],
            }).success,
        ).toBe(false);
    });
});
