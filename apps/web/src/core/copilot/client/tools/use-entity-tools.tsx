"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { EntityMatch } from "@/core/copilot/client/analysis/entity-search";
import { searchEntities } from "@/core/copilot/client/analysis/entity-search";
import { catalogSectors } from "@/core/copilot/client/data/entity-catalog";
import { parseToolResult } from "@/core/copilot/client/tools/tool-result";
import { EntityCandidatesCard } from "@/core/copilot/client/ui/entity-candidates-card";

const searchEntitiesParams = z.object({
    query: z
        .string()
        .min(1)
        .describe(
            "Nombre, apodo, sector o NIT de la entidad a buscar (ej. 'alcaldía de Bogotá', 'SENA', 'educación')",
        ),
});

/**
 * `searchEntities` — turns an entity NAME into a NIT the agent can sweep.
 *
 * Croma has no name→NIT search, so a user who doesn't know tax ids could never
 * create a frente. This resolves names against a curated catalog and hands the
 * copilot real NITs to propose. It never writes anything: the copilot follows a
 * hit with `proposeWatchlist`, which the user still confirms.
 */
export function useEntityTools() {
    useFrontendTool({
        name: "searchEntities",
        description:
            "Busca el NIT de una entidad contratante por su nombre, apodo o sector. Úsalo SIEMPRE que el usuario quiera vigilar algo pero no dé un NIT (ej. 'vigila la alcaldía de Bogotá', 'entidades de salud'). Devuelve candidatos con su NIT real; luego propón la vigilancia con proposeWatchlist usando ese NIT. Si no hay coincidencias, pide el NIT al usuario. Sectores disponibles: " +
            catalogSectors().join(", ") +
            ".",
        parameters: searchEntitiesParams,
        handler: async ({ query }) => {
            const matches = searchEntities(query);
            return {
                query,
                matches: matches.map((m) => ({
                    nit: m.nit,
                    name: m.name,
                    kind: m.kind,
                    sector: m.sector,
                })),
            };
        },
        render: ({ result, args }) => {
            const r = parseToolResult<{
                query: string;
                matches: EntityMatch[];
            }>(result);
            if (!r) return null; // still running
            return (
                <EntityCandidatesCard
                    matches={r.matches ?? []}
                    query={r.query ?? args?.query ?? ""}
                />
            );
        },
    });
}
