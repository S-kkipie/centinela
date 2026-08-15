import type { ProjectSearch } from "@/core/project/domain/types";
import { searchProjectsService } from "@/core/project/server/services/search-projects-service";
import { resolveResult } from "@/frontend/lib/result";
import { requireAuth } from "@/server/auth/require-auth";
import ProjectsTable from "./data-table";

/**
 * Server entry for the projects table (the SSR data source). Kicks off
 * `searchProjectsService` but does NOT await it — `Promise.all([...])` is
 * handed straight to the client `ProjectsTable`, which reads it with
 * `React.use(promises)` under the route's `<Suspense>` boundary, so the
 * response streams instead of blocking on the query. `resolveResult` unwraps
 * the `AppResult` into `PaginatedProjects`, or throws an `AppErrorException` —
 * caught by the sibling `error.tsx` boundary. The table writes URL params with
 * `shallow:false`, so any page/sort/filter change re-runs this RSC.
 */
export default async function ProjectsTableServer({
    options,
}: {
    options: ProjectSearch;
}) {
    const { user } = await requireAuth();
    const promises = Promise.all([
        resolveResult(searchProjectsService(user.id, options)),
    ]);

    return <ProjectsTable promises={promises} />;
}
