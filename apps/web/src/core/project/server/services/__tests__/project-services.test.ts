import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repository/find-project-by-id", () => ({
    findProjectById: vi.fn(),
}));
vi.mock("../../repository/create-project", () => ({ createProject: vi.fn() }));
vi.mock("../../repository/delete-project", () => ({ deleteProject: vi.fn() }));
vi.mock("../../repository/find-projects-page", () => ({
    findProjectsPage: vi.fn(),
}));
vi.mock("../../repository/update-project", () => ({ updateProject: vi.fn() }));

import type { ProjectSearch } from "@/core/project/domain/types";
import { createProject } from "../../repository/create-project";
import { deleteProject } from "../../repository/delete-project";
import { findProjectById } from "../../repository/find-project-by-id";
import { findProjectsPage } from "../../repository/find-projects-page";
import { updateProject } from "../../repository/update-project";
import { createProjectService } from "../create-project-service";
import { deleteProjectService } from "../delete-project-service";
import { getProjectService } from "../get-project-service";
import { searchProjectsService } from "../search-projects-service";
import { updateProjectService } from "../update-project-service";

const row = {
    id: "p1",
    userId: "u1",
    name: "Alpha",
    description: null,
    status: "active" as const,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("getProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when the row is missing or foreign", async () => {
        vi.mocked(findProjectById).mockResolvedValue(null);
        const r = await getProjectService("u1", "p1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });

    it("maps a row to the ISO-string wire shape", async () => {
        vi.mocked(findProjectById).mockResolvedValue(row);
        const r = await getProjectService("u1", "p1");
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.createdAt).toBe("2026-01-01T00:00:00.000Z");
            expect(r.data.name).toBe("Alpha");
        }
    });
});

describe("createProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns the mapped created project", async () => {
        vi.mocked(createProject).mockResolvedValue(row);
        const r = await createProjectService("u1", { name: "Alpha" });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.id).toBe("p1");
    });
});

describe("deleteProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when nothing was deleted", async () => {
        vi.mocked(deleteProject).mockResolvedValue(null);
        const r = await deleteProjectService("u1", "p1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });

    it("returns the deleted project on success", async () => {
        vi.mocked(deleteProject).mockResolvedValue({ id: "p1" });
        const r = await deleteProjectService("u1", "p1");
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.id).toBe("p1");
    });
});

const searchParams: ProjectSearch = {
    page: 1,
    perPage: 2,
    sort: [],
    status: [],
    name: "",
};

describe("searchProjectsService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("maps rows to items and computes pageCount from total/perPage", async () => {
        vi.mocked(findProjectsPage).mockResolvedValue({
            rows: [row],
            total: 5,
        });
        const r = await searchProjectsService("u1", searchParams);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.items).toHaveLength(1);
            expect(r.data.items[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
            expect(r.data.total).toBe(5);
            expect(r.data.page).toBe(1);
            expect(r.data.perPage).toBe(2);
            expect(r.data.pageCount).toBe(3);
        }
    });

    it("returns an empty page when there are no matches", async () => {
        vi.mocked(findProjectsPage).mockResolvedValue({ rows: [], total: 0 });
        const r = await searchProjectsService("u1", searchParams);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.items).toHaveLength(0);
            expect(r.data.total).toBe(0);
            expect(r.data.pageCount).toBe(0);
        }
    });

    it("returns an INTERNAL_SERVER_ERROR when the repository throws", async () => {
        vi.mocked(findProjectsPage).mockRejectedValue(new Error("db down"));
        const r = await searchProjectsService("u1", searchParams);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
});

describe("updateProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when the project does not exist or is foreign", async () => {
        vi.mocked(updateProject).mockResolvedValue(null);
        const r = await updateProjectService("u1", "p1", { name: "Updated" });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });

    it("returns the mapped updated project", async () => {
        vi.mocked(updateProject).mockResolvedValue(row);
        const r = await updateProjectService("u1", "p1", { name: "Alpha" });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.name).toBe("Alpha");
    });
});
