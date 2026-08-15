import { describe, expect, it } from "vitest";
import { analyzeConcentration } from "@/core/copilot/client/analysis/concentration";
import {
    buildDenuncia,
    buildDocument,
    buildDossier,
    buildHilo,
    buildPropuesta,
    slugify,
    splitForThread,
} from "@/core/copilot/client/deliverables/documents";
import type { Finding } from "@/core/finding/domain/types";

const GENERATED_AT = "2026-08-15T14:32:00.000Z";

const redFlag: Finding = {
    id: "f-1",
    watchlistId: "w-1",
    tenderId: "CO1.NTC.7788",
    entityId: "899999061",
    entityName: "Secretaría de Salud de Bogotá",
    kind: "BANDERA_ROJA",
    score: 91,
    title: "Adjudicación con proponente único en 4 días",
    summary:
        "El proceso se abrió y adjudicó en cuatro días hábiles a un proponente que se constituyó dos meses antes.",
    evidence: [
        {
            source: "secop-tender-by-id",
            url: "https://example.gov.co/secop/CO1.NTC.7788",
            claim: "Apertura 2026-08-01, adjudicación 2026-08-05",
        },
        {
            source: "rues-entity-by-nit",
            claim: "Adjudicatario matriculado el 2026-06-02",
        },
    ],
    createdAt: "2026-08-14T09:00:00.000Z",
    updatedAt: "2026-08-14T09:00:00.000Z",
};

const opportunity: Finding = {
    ...redFlag,
    id: "f-2",
    kind: "OPORTUNIDAD",
    score: 78,
    title: "Suministro de insumos hospitalarios",
    summary:
        "Proceso abierto, tres proponentes históricos, requisitos estándar.",
};

const opts = { generatedAt: GENERATED_AT };

describe("slugify", () => {
    it("strips accents and punctuation", () => {
        expect(slugify("Contraloría General")).toBe("contraloria-general");
        expect(slugify("CO1.NTC.7788")).toBe("co1-ntc-7788");
    });

    it("never leaves leading or trailing separators", () => {
        expect(slugify("  ¡hola!  ")).toBe("hola");
    });
});

describe("buildDossier", () => {
    const doc = buildDossier(redFlag, opts);

    it("names the file after the tender", () => {
        expect(doc.filename).toBe("dossier-co1-ntc-7788.md");
        expect(doc.kind).toBe("dossier");
    });

    it("carries the verdict, the process and both timestamps", () => {
        expect(doc.markdown).toContain(redFlag.summary);
        expect(doc.markdown).toContain("CO1.NTC.7788");
        expect(doc.markdown).toContain("BANDERA ROJA");
        expect(doc.markdown).toContain("2026-08-14 09:00Z");
        expect(doc.markdown).toContain("2026-08-15 14:32Z");
    });

    it("cites every piece of evidence with its source and link", () => {
        expect(doc.markdown).toContain("secop-tender-by-id");
        expect(doc.markdown).toContain(
            "https://example.gov.co/secop/CO1.NTC.7788",
        );
        expect(doc.markdown).toContain("rues-entity-by-nit");
    });

    it("states where the data came from", () => {
        expect(doc.markdown).toContain("Croma");
    });

    it("omits the concentration section when the network has no awards", () => {
        const withEmpty = buildDossier(redFlag, {
            ...opts,
            concentration: analyzeConcentration([]),
        });
        expect(withEmpty.markdown).not.toContain(
            "Concentración de adjudicaciones",
        );
    });

    it("includes concentration when the network has awards", () => {
        const report = analyzeConcentration(
            [
                {
                    fromNit: "899999061",
                    toNit: "900111",
                    relation: "adjudicatario",
                },
                {
                    fromNit: "899999061",
                    toNit: "900111",
                    relation: "adjudicatario",
                },
                {
                    fromNit: "899999061",
                    toNit: "900111",
                    relation: "adjudicatario",
                },
            ],
            { watchedNits: new Set(["899999061"]) },
        );
        const doc2 = buildDossier(redFlag, { ...opts, concentration: report });
        expect(doc2.markdown).toContain("Concentración de adjudicaciones");
        expect(doc2.markdown).toContain("900111");
    });

    it("says so plainly when a finding carries no evidence", () => {
        const bare = buildDossier({ ...redFlag, evidence: [] }, opts);
        expect(bare.markdown).toContain("no registró evidencia");
    });
});

describe("buildDenuncia", () => {
    it("leaves the signer as a placeholder when unknown", () => {
        const doc = buildDenuncia(redFlag, opts);
        expect(doc.markdown).toContain("[NOMBRE DEL PETICIONARIO]");
        expect(doc.markdown).toContain("Ley 1755 de 2015");
        expect(doc.filename).toBe("peticion-co1-ntc-7788.md");
    });

    it("uses the requester's name when given", () => {
        const doc = buildDenuncia(redFlag, {
            ...opts,
            requesterName: "Diego Ramírez",
        });
        expect(doc.markdown).toContain("Diego Ramírez");
        expect(doc.markdown).not.toContain("[NOMBRE DEL PETICIONARIO]");
    });

    // It is a legal document addressed to a real entity: it must never read as
    // if it were already filed.
    it("marks itself a draft and disclaims legal advice", () => {
        const doc = buildDenuncia(redFlag, opts);
        expect(doc.markdown).toContain("Borrador");
        expect(doc.markdown).toContain("no radica documentos");
    });

    it("addresses the contracting entity and asks for the file", () => {
        const doc = buildDenuncia(redFlag, opts);
        expect(doc.markdown).toContain("Secretaría de Salud de Bogotá");
        expect(doc.markdown).toContain("899999061");
        expect(doc.markdown).toContain("expediente contractual");
    });
});

describe("buildPropuesta", () => {
    const doc = buildPropuesta(opportunity, opts);

    it("produces an unchecked checklist", () => {
        expect(doc.markdown).toContain("- [ ]");
        expect(doc.markdown).not.toContain("- [x]");
    });

    it("covers the three habilitante families", () => {
        expect(doc.markdown).toContain("Jurídico");
        expect(doc.markdown).toContain("Financiero");
        expect(doc.markdown).toContain("Técnico");
    });

    it("sends the user to the real pliego rather than replacing it", () => {
        expect(doc.markdown).toContain("no las reemplaza");
    });
});

describe("splitForThread", () => {
    it("leaves a short text as one post", () => {
        expect(splitForThread("corto")).toEqual(["corto"]);
    });

    it("splits on word boundaries under the limit", () => {
        const text = Array.from({ length: 40 }, () => "palabra").join(" ");
        const posts = splitForThread(text, 60);
        expect(posts.length).toBeGreaterThan(1);
        for (const p of posts) expect(p.length).toBeLessThanOrEqual(60);
        expect(posts.join(" ")).toBe(text);
    });

    it("lets a single over-long word stand rather than mangling a URL", () => {
        const url = `https://example.gov.co/${"x".repeat(300)}`;
        expect(splitForThread(url, 60)).toEqual([url]);
    });
});

describe("buildHilo", () => {
    const doc = buildHilo(redFlag, opts);

    it("numbers every post consistently", () => {
        const total = (doc.markdown.match(/\*\*\d+\/(\d+)\*\*/g) ?? []).length;
        expect(total).toBeGreaterThan(1);
        const declared = doc.markdown.match(/\*\*1\/(\d+)\*\*/);
        expect(Number(declared?.[1])).toBe(total);
    });

    it("opens with the entity and the score, and ends with sources", () => {
        expect(doc.markdown).toContain("Secretaría de Salud de Bogotá");
        expect(doc.markdown).toContain("91/100");
        expect(doc.markdown).toContain(
            "https://example.gov.co/secop/CO1.NTC.7788",
        );
    });

    it("falls back to the SECOP process when no evidence carries a link", () => {
        const noLinks = buildHilo(
            {
                ...redFlag,
                evidence: [{ source: "rues-entity-by-nit", claim: "sin url" }],
            },
            opts,
        );
        expect(noLinks.markdown).toContain("SECOP");
    });

    it("marks itself a draft", () => {
        expect(doc.markdown).toContain("Borrador");
    });
});

describe("buildDocument", () => {
    it("dispatches on kind", () => {
        expect(buildDocument("denuncia", redFlag, opts).kind).toBe("denuncia");
        expect(buildDocument("propuesta", opportunity, opts).kind).toBe(
            "propuesta",
        );
        expect(buildDocument("hilo", redFlag, opts).kind).toBe("hilo");
        expect(buildDocument("dossier", redFlag, opts).kind).toBe("dossier");
    });
});
