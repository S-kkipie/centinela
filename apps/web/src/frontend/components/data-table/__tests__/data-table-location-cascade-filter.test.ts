import { describe, expect, it } from "vitest";

import {
    cascadeOptions,
    clearBelow,
} from "../data-table-location-cascade-filter";

const tree = { Lima: { Lima: ["Miraflores", "San Isidro"] }, Cusco: {} };

describe("cascadeOptions", () => {
    it("level1 from tree keys; level2 from selected level1; level3 from selected level2", () => {
        expect(cascadeOptions(tree, {}).level1).toEqual(["Cusco", "Lima"]);
        expect(cascadeOptions(tree, { level1: "Lima" }).level2).toEqual([
            "Lima",
        ]);
        expect(
            cascadeOptions(tree, { level1: "Lima", level2: "Lima" }).level3,
        ).toEqual(["Miraflores", "San Isidro"]);
        expect(cascadeOptions(tree, { level1: "Cusco" }).level2).toEqual([]);
    });

    it("returns empty level3 when the selected level2 has no districts", () => {
        const t = { Lima: { Lima: [] as string[] } };
        expect(
            cascadeOptions(t, { level1: "Lima", level2: "Lima" }).level3,
        ).toEqual([]);
    });
});

describe("clearBelow", () => {
    it("setting level1 clears level2/3; setting level2 clears level3", () => {
        expect(
            clearBelow(
                { level1: "Lima", level2: "Lima", level3: "Miraflores" },
                "level1",
                "Cusco",
            ),
        ).toEqual({ level1: "Cusco" });
        expect(
            clearBelow(
                { level1: "Lima", level2: "Lima", level3: "Miraflores" },
                "level2",
                "Lima",
            ),
        ).toEqual({ level1: "Lima", level2: "Lima" });
        expect(clearBelow({ level1: "Lima" }, "level1", undefined)).toEqual({});
    });
});
