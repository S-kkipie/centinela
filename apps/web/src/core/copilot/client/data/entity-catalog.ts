/**
 * A starter catalog of major Colombian public contracting entities, so the
 * copilot can turn "vigila la alcaldía de Bogotá" into a NIT the agent sweeps.
 *
 * Croma has no name→NIT search — every endpoint takes a NIT. This bridges the
 * gap for the common case (a user who knows the entity, not its tax id).
 *
 * IMPORTANT: these NITs are best-effort seeds, NOT ground truth. Nothing is
 * created from this list alone — `verifyEntity` confirms a NIT against SECOP
 * (real name + live process count) and the user confirms the frente in the HITL
 * card. A wrong seed fails safe: SECOP returns nothing and the copilot won't
 * propose it. The one NIT proven in production is Bogotá D.C. (899999061).
 */

import type { WatchTargetKind } from "@centinela/contracts/watch";

export type CatalogEntity = {
    nit: string;
    name: string;
    /** Extra search terms — nicknames, cities, acronyms. */
    aliases: string[];
    kind: WatchTargetKind;
    /** Grouping for "muéstrame entidades de salud/educación…". */
    sector: string;
};

export const ENTITY_CATALOG: readonly CatalogEntity[] = [
    // Distritos / grandes alcaldías
    {
        nit: "899999061",
        name: "Alcaldía Mayor de Bogotá D.C.",
        aliases: ["bogota", "distrito capital", "bogota dc"],
        kind: "contratante",
        sector: "Territorial",
    },
    {
        nit: "890905211",
        name: "Municipio de Medellín",
        aliases: ["medellin", "alcaldia de medellin"],
        kind: "contratante",
        sector: "Territorial",
    },
    {
        nit: "890399011",
        name: "Municipio de Santiago de Cali",
        aliases: ["cali", "alcaldia de cali", "santiago de cali"],
        kind: "contratante",
        sector: "Territorial",
    },
    {
        nit: "890102018",
        name: "Distrito de Barranquilla",
        aliases: ["barranquilla", "alcaldia de barranquilla"],
        kind: "contratante",
        sector: "Territorial",
    },
    {
        nit: "890900286",
        name: "Departamento de Antioquia",
        aliases: ["gobernacion de antioquia", "antioquia"],
        kind: "contratante",
        sector: "Territorial",
    },
    {
        nit: "899999114",
        name: "Departamento de Cundinamarca",
        aliases: ["gobernacion de cundinamarca", "cundinamarca"],
        kind: "contratante",
        sector: "Territorial",
    },
    // Nacional
    {
        nit: "899999034",
        name: "Servicio Nacional de Aprendizaje (SENA)",
        aliases: ["sena", "servicio nacional de aprendizaje"],
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
    {
        nit: "800215807",
        name: "Instituto Nacional de Vías (INVÍAS)",
        aliases: ["invias", "instituto nacional de vias"],
        kind: "contratante",
        sector: "Infraestructura",
    },
];

/** Sectors present in the catalog, for "qué sectores puedo vigilar". */
export function catalogSectors(): string[] {
    return [...new Set(ENTITY_CATALOG.map((e) => e.sector))].sort();
}
