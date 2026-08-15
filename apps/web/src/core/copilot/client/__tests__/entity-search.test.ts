import { describe, expect, it } from "vitest";
import {
    entitiesBySector,
    type normalize as _n,
    looksLikeNit,
    normalize,
    searchEntities,
} from "@/core/copilot/client/analysis/entity-search";
import type { CatalogEntity } from "@/core/copilot/client/data/entity-catalog";

const catalog: CatalogEntity[] = [
    {
        nit: "899999061",
        name: "Alcaldía Mayor de Bogotá D.C.",
        aliases: ["bogota", "distrito capital"],
        kind: "contratante",
        sector: "Territorial",
    },
    {
        nit: "899999034",
        name: "Servicio Nacional de Aprendizaje (SENA)",
        aliases: ["sena"],
        kind: "contratante",
        sector: "Educación",
    },
    {
        nit: "899999239",
        name: "Instituto Colombiano de Bienestar Familiar (ICBF)",
        aliases: ["icbf", "bienestar familiar"],
        kind: "contratante",
        sector: "Social",
    },
];

describe("normalize", () => {
    it("strips accents, case and punctuation", () => {
        expect(normalize("Alcaldía de Bogotá D.C.")).toBe(
            "alcaldia de bogota d c",
        );
        expect(normalize("  Educación  ")).toBe("educacion");
    });
});

describe("searchEntities", () => {
    it("matches an accented full name typed without accents", () => {
        const r = searchEntities("alcaldia de bogota", 5, catalog);
        expect(r[0].nit).toBe("899999061");
    });

    it("matches by alias / nickname", () => {
        expect(searchEntities("bogota", 5, catalog)[0].nit).toBe("899999061");
        expect(searchEntities("sena", 5, catalog)[0].nit).toBe("899999034");
        expect(searchEntities("icbf", 5, catalog)[0].nit).toBe("899999239");
    });

    it("matches a bare NIT that is in the catalog", () => {
        expect(searchEntities("899999239", 5, catalog)[0].nit).toBe(
            "899999239",
        );
    });

    it("returns nothing for an unknown query", () => {
        expect(searchEntities("ministerio de hacienda", 5, catalog)).toEqual(
            [],
        );
        // A NIT not in the catalog is a miss — caller falls back to verifyEntity.
        expect(searchEntities("800111222", 5, catalog)).toEqual([]);
    });

    it("ranks the exact alias above a partial token match", () => {
        // "bienestar" only hits ICBF's alias; must come first.
        const r = searchEntities("bienestar", 5, catalog);
        expect(r[0].nit).toBe("899999239");
    });

    it("ignores stopword-only queries", () => {
        expect(searchEntities("de la", 5, catalog)).toEqual([]);
    });

    it("respects the limit", () => {
        // "instituto" is in both SENA-adjacent and ICBF names? Only ICBF here,
        // so cap with limit 1 on a query that could match several.
        expect(
            searchEntities("nacional", 1, catalog).length,
        ).toBeLessThanOrEqual(1);
    });
});

describe("entitiesBySector", () => {
    it("groups by sector, accent-insensitive", () => {
        const r = entitiesBySector("educacion", catalog);
        expect(r.map((e) => e.nit)).toEqual(["899999034"]);
    });
});

describe("looksLikeNit", () => {
    it("accepts plain NITs and rejects names", () => {
        expect(looksLikeNit("899999061")).toBe(true);
        expect(looksLikeNit("900123456-7")).toBe(true);
        expect(looksLikeNit(" 830053105 ")).toBe(true);
        expect(looksLikeNit("Alcaldía de Bogotá")).toBe(false);
        expect(looksLikeNit("123")).toBe(false); // too short
    });
});
