import { describe, expect, it } from "vitest";
import {
    createProjectSchema,
    projectSchema,
    projectSearchSchema,
    updateProjectSchema,
} from "../schemas";

describe("createProjectSchema", () => {
    it("accepts a name and optional fields", () => {
        const parsed = createProjectSchema.parse({ name: "Launch" });
        expect(parsed.name).toBe("Launch");
    });

    it("rejects an empty name", () => {
        expect(createProjectSchema.safeParse({ name: "" }).success).toBe(false);
    });

    it("rejects a whitespace-only name", () => {
        expect(createProjectSchema.safeParse({ name: "   " }).success).toBe(
            false,
        );
    });

    it("trims a padded name", () => {
        expect(createProjectSchema.parse({ name: "  Launch  " }).name).toBe(
            "Launch",
        );
    });

    it("rejects an unknown status", () => {
        expect(
            createProjectSchema.safeParse({ name: "x", status: "nope" })
                .success,
        ).toBe(false);
    });
});

describe("updateProjectSchema", () => {
    it("allows a partial update", () => {
        expect(
            updateProjectSchema.safeParse({ status: "archived" }).success,
        ).toBe(true);
    });

    it("allows description to be nulled", () => {
        expect(
            updateProjectSchema.safeParse({ description: null }).success,
        ).toBe(true);
    });
});

describe("projectSchema", () => {
    it("requires ISO string timestamps", () => {
        const ok = projectSchema.safeParse({
            id: "p1",
            userId: "u1",
            name: "A",
            description: null,
            status: "active",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
        });
        expect(ok.success).toBe(true);
    });
});

describe("projectSearchSchema", () => {
    it("normalizes a single status value into a 1-element array", () => {
        expect(projectSearchSchema.parse({ status: "active" }).status).toEqual([
            "active",
        ]);
    });

    it("passes an array of statuses through unchanged", () => {
        expect(
            projectSearchSchema.parse({ status: ["active", "archived"] })
                .status,
        ).toEqual(["active", "archived"]);
    });

    it("defaults status to an empty array when missing", () => {
        expect(projectSearchSchema.parse({}).status).toEqual([]);
    });

    it("degrades an invalid status to an empty array instead of throwing", () => {
        expect(projectSearchSchema.parse({ status: "bogus" }).status).toEqual(
            [],
        );
    });

    it("parses a JSON-encoded sort string", () => {
        expect(
            projectSearchSchema.parse({
                sort: '[{"id":"name","desc":true}]',
            }).sort,
        ).toEqual([{ id: "name", desc: true }]);
    });

    it("passes an already-parsed sort array through unchanged", () => {
        expect(
            projectSearchSchema.parse({
                sort: [{ id: "status", desc: false }],
            }).sort,
        ).toEqual([{ id: "status", desc: false }]);
    });

    it("degrades a malformed sort string to an empty array", () => {
        expect(projectSearchSchema.parse({ sort: "not json" }).sort).toEqual(
            [],
        );
    });

    it("degrades a sort with an unknown column to an empty array", () => {
        expect(
            projectSearchSchema.parse({ sort: '[{"id":"evil","desc":true}]' })
                .sort,
        ).toEqual([]);
    });

    it("coerces page/perPage from strings and applies defaults", () => {
        const parsed = projectSearchSchema.parse({
            page: "3",
            perPage: "50",
        });
        expect(parsed.page).toBe(3);
        expect(parsed.perPage).toBe(50);

        const defaults = projectSearchSchema.parse({});
        expect(defaults.page).toBe(1);
        expect(defaults.perPage).toBe(20);
    });

    it("trims name", () => {
        expect(projectSearchSchema.parse({ name: "  hi  " }).name).toBe("hi");
    });
});
