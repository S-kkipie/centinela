import { describe, expect, it } from "vitest";
import {
    type BriefingFinding,
    briefingToMessage,
    composeBriefing,
    topRedFlag,
} from "@/core/copilot/client/autonomy/briefing";
import {
    alertMessage,
    describeDiff,
    diffFeed,
} from "@/core/copilot/client/autonomy/feed-diff";

const NOW = new Date("2026-08-15T12:00:00.000Z");

function finding(over: Partial<BriefingFinding> = {}): BriefingFinding {
    return {
        id: "f-1",
        title: "Adjudicación en 4 días",
        entityName: "Secretaría de Salud de Bogotá",
        kind: "BANDERA_ROJA",
        score: 91,
        createdAt: "2026-08-15T09:00:00.000Z",
        ...over,
    };
}

describe("topRedFlag", () => {
    it("returns null with no red flags", () => {
        expect(topRedFlag([finding({ kind: "OPORTUNIDAD" })])).toBeNull();
    });

    it("picks the highest score", () => {
        const best = topRedFlag([
            finding({ id: "a", score: 60 }),
            finding({ id: "b", score: 88 }),
        ]);
        expect(best?.id).toBe("b");
    });

    it("breaks ties by recency", () => {
        const best = topRedFlag([
            finding({
                id: "old",
                score: 80,
                createdAt: "2026-08-10T00:00:00.000Z",
            }),
            finding({
                id: "new",
                score: 80,
                createdAt: "2026-08-14T00:00:00.000Z",
            }),
        ]);
        expect(best?.id).toBe("new");
    });
});

describe("composeBriefing", () => {
    it("asks for a frente when there is none — nothing else can happen first", () => {
        const b = composeBriefing({
            findings: [],
            watchlistNames: [],
            lastSeenAt: null,
            now: NOW,
        });
        expect(b.action).toEqual({
            kind: "createWatchlist",
            label: "Crear un frente",
        });
        expect(b.headline).toContain("ningún frente");
    });

    it("explains the wait when a frente exists but has no findings", () => {
        const b = composeBriefing({
            findings: [],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: null,
            now: NOW,
        });
        expect(b.action).toBeNull();
        expect(b.headline).toContain("1 frente");
        expect(b.lines.join(" ")).toContain("próximo barrido");
    });

    it("counts both verdicts in the headline", () => {
        const b = composeBriefing({
            findings: [
                finding({ id: "a" }),
                finding({ id: "b", kind: "OPORTUNIDAD", score: 70 }),
                finding({ id: "c", kind: "OPORTUNIDAD", score: 65 }),
            ],
            watchlistNames: ["Salud Bogotá", "Movilidad"],
            lastSeenAt: null,
            now: NOW,
        });
        expect(b.headline).toContain("2 frentes");
        expect(b.headline).toContain("1 bandera roja");
        expect(b.headline).toContain("2 oportunidades");
    });

    it("says it is a first visit when there is no last-seen stamp", () => {
        const b = composeBriefing({
            findings: [finding()],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: null,
            now: NOW,
        });
        expect(b.lines.join(" ")).toContain("primera visita");
    });

    it("counts what arrived since the last visit", () => {
        const b = composeBriefing({
            findings: [
                finding({ id: "old", createdAt: "2026-08-10T00:00:00.000Z" }),
                finding({ id: "new", createdAt: "2026-08-15T09:00:00.000Z" }),
            ],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: "2026-08-14T00:00:00.000Z",
            now: NOW,
        });
        expect(b.lines.join(" ")).toContain("1 hallazgo nuevo");
    });

    it("says so when nothing arrived since the last visit", () => {
        const b = composeBriefing({
            findings: [
                finding({ id: "old", createdAt: "2026-08-10T00:00:00.000Z" }),
            ],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: "2026-08-14T00:00:00.000Z",
            now: NOW,
        });
        expect(b.lines.join(" ")).toContain("Nada nuevo");
    });

    it("leads with the worst red flag and offers to open it", () => {
        const b = composeBriefing({
            findings: [
                finding({ id: "mild", score: 55 }),
                finding({ id: "bad", score: 93, title: "Proponente único" }),
            ],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: null,
            now: NOW,
        });
        expect(b.lines.join(" ")).toContain("Proponente único");
        expect(b.action).toEqual({
            kind: "openFinding",
            findingId: "bad",
            label: "Abrir el informe",
        });
    });

    // A low-scoring flag still gets offered, but must not be dressed as urgent.
    it("does not dramatise a low-scoring red flag", () => {
        const b = composeBriefing({
            findings: [finding({ id: "mild", score: 40 })],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: null,
            now: NOW,
        });
        expect(b.lines.join(" ")).toContain("nada urgente");
        expect(b.action).toMatchObject({ kind: "openFinding" });
    });

    it("says the board is clean when everything is an opportunity", () => {
        const b = composeBriefing({
            findings: [finding({ kind: "OPORTUNIDAD", score: 80 })],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: null,
            now: NOW,
        });
        expect(b.lines.join(" ")).toContain("Ninguna bandera roja");
        expect(b.action).toBeNull();
    });

    it("renders as one multi-line message", () => {
        const b = composeBriefing({
            findings: [finding()],
            watchlistNames: ["Salud Bogotá"],
            lastSeenAt: null,
            now: NOW,
        });
        expect(briefingToMessage(b).split("\n")[0]).toBe(b.headline);
    });
});

describe("diffFeed", () => {
    const previous = new Set(["f-old"]);

    it("finds nothing when every id was already seen", () => {
        const d = diffFeed(previous, [finding({ id: "f-old" })]);
        expect(d.fresh).toHaveLength(0);
        expect(d.alert).toBeNull();
        expect(describeDiff(d)).toBeNull();
    });

    it("reports fresh items", () => {
        const d = diffFeed(previous, [
            finding({ id: "f-old" }),
            finding({ id: "f-new", kind: "OPORTUNIDAD", score: 70 }),
        ]);
        expect(d.fresh.map((f) => f.id)).toEqual(["f-new"]);
        expect(d.freshRedFlags).toHaveLength(0);
        expect(describeDiff(d)).toContain("sin banderas rojas");
    });

    it("interrupts only for a high-scoring fresh red flag", () => {
        const quiet = diffFeed(previous, [finding({ id: "f-a", score: 50 })]);
        expect(quiet.freshRedFlags).toHaveLength(1);
        expect(quiet.alert).toBeNull();

        const loud = diffFeed(previous, [finding({ id: "f-b", score: 91 })]);
        expect(loud.alert?.id).toBe("f-b");
    });

    // A red flag that was already on screen must not re-alert every 5 seconds.
    it("never re-alerts for an id already seen", () => {
        const d = diffFeed(new Set(["f-b"]), [
            finding({ id: "f-b", score: 91 }),
        ]);
        expect(d.alert).toBeNull();
    });

    it("orders fresh red flags worst first", () => {
        const d = diffFeed(previous, [
            finding({ id: "a", score: 72 }),
            finding({ id: "b", score: 95 }),
        ]);
        expect(d.freshRedFlags.map((f) => f.id)).toEqual(["b", "a"]);
    });
});

describe("alertMessage", () => {
    it("names the entity, the score and what it did about it", () => {
        const text = alertMessage(finding());
        expect(text).toContain("Secretaría de Salud de Bogotá");
        expect(text).toContain("91");
        expect(text).toContain("informe");
    });
});
