import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";
import { getSortingStateParser } from "@/frontend/lib/parsers";
import type { Project } from "./types";

/**
 * nuqs parsers describing the projects table URL state. Keys MUST match what
 * `useDataTable` writes on the client (`page`, `perPage`, `sort`, plus `status`
 * and `name` since those columns are filterable — `useDataTable` wires a
 * `?status=`/`?name=` URL parser per filterable column) so the server cache
 * below and the client table engine agree on one URL contract.
 */
export const projectSearchParsers = {
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(20),
    sort: getSortingStateParser<Project>().withDefault([
        { id: "createdAt", desc: true },
    ]),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    name: parseAsString.withDefault(""),
};

/**
 * Request-scoped search-params cache for the `/projects` RSC tree. `page.tsx`
 * calls `.parse(searchParams)` once; the table `server.tsx` reads the parsed
 * state back with `.all()` (React `cache()`-backed, same request). The page then
 * runs those values through `projectSearchSchema.parse` to coerce/whitelist them
 * into a `ProjectSearch` before calling `searchProjectsService`.
 */
export const projectsSearchParamsCache =
    createSearchParamsCache(projectSearchParsers);
