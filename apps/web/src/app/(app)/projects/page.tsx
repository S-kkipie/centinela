import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import ProjectsTableServer from "@/core/project/client/ui/table/server";
import { projectSearchSchema } from "@/core/project/domain/schemas";
import { projectsSearchParamsCache } from "@/core/project/domain/search-params";
import { DataTableSkeleton } from "@/frontend/components/data-table/data-table-skeleton";

/**
 * Server entry for `/projects`. Parses the URL into a `ProjectSearch` and
 * renders the table `server.tsx` under a `<Suspense>` boundary — `server.tsx`
 * hands the client table an *unawaited* promise (`React.use`), so this page
 * streams the shell immediately and the table fills in once the query
 * resolves, instead of blocking the whole route on the DB round-trip.
 */
export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const options = projectSearchSchema.parse(
        await projectsSearchParamsCache.parse(searchParams),
    );

    return (
        <Suspense
            fallback={
                <div className="mx-auto w-full max-w-5xl p-6">
                    <DataTableSkeleton columnCount={6} filterCount={2} />
                </div>
            }
        >
            <ProjectsTableServer options={options} />
        </Suspense>
    );
}
