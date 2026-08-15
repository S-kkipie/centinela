"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { useCopilotUi } from "@/core/copilot/client/store";
import {
    explainFindingParams,
    filterFindingsParams,
    openFindingParams,
    resolveFinding,
    toFindingFilter,
} from "@/core/copilot/client/tools/finding-tools-core";
import { EvidenceCard } from "@/core/copilot/client/ui/evidence-card";
import { useFindingsFeed } from "@/core/finding/client/hooks";

function filterLabel(args: z.infer<typeof filterFindingsParams>): string {
    const parts = [
        args.kind === "BANDERA_ROJA"
            ? "banderas rojas"
            : args.kind === "OPORTUNIDAD"
              ? "oportunidades"
              : null,
        args.entityQuery ?? null,
        args.sinceDays != null ? `últimos ${args.sinceDays} días` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "sin filtro";
}

/**
 * Copilot frontend tools over the findings inbox. Mount once inside the
 * authenticated tree (the chat panel does it); inert until then.
 */
export function useFindingTools() {
    const router = useRouter();
    const { setFindingFilter, focusFinding } = useCopilotUi();
    const { data: feed } = useFindingsFeed();

    useFrontendTool({
        name: "filterFindings",
        description:
            "Filtra el inbox de hallazgos del Panel por tipo (OPORTUNIDAD o BANDERA_ROJA), entidad (subcadena del nombre), recencia en días y/o vigilada. Sin parámetros limpia el filtro. Navega al Panel si hace falta.",
        parameters: filterFindingsParams,
        handler: async (args) => {
            const filter = toFindingFilter(args);
            setFindingFilter(filter);
            router.push("/dashboard");
            return filter
                ? `Filtro aplicado: ${filterLabel(args)}`
                : "Filtro limpiado";
        },
        render: ({ args }) => (
            <p className="label-ops my-1 text-muted-foreground">
                Filtrando: {filterLabel(args ?? {})}
            </p>
        ),
    });

    useFrontendTool({
        name: "openFinding",
        description:
            "Abre un hallazgo en el Panel (lo selecciona y muestra su informe). Recibe el id del hallazgo.",
        parameters: openFindingParams,
        handler: async ({ findingId }) => {
            const finding = resolveFinding(feed?.items ?? [], findingId);
            if (!finding) return { error: "hallazgo no encontrado" };
            focusFinding(finding.id);
            router.push("/dashboard");
            return `Abriendo: ${finding.title}`;
        },
    });

    useFrontendTool({
        name: "explainFinding",
        description:
            "Explica un hallazgo con su veredicto y la cadena de evidencia citada (fuentes oficiales con enlaces). Úsalo cuando pregunten por qué un proceso es bandera roja u oportunidad.",
        parameters: explainFindingParams,
        handler: async ({ findingId }) => {
            const finding = resolveFinding(feed?.items ?? [], findingId);
            if (!finding) return { error: "hallazgo no encontrado" };
            return { finding };
        },
        render: ({ result }) => {
            const r = result as
                | { finding?: unknown; error?: string }
                | undefined;
            if (!r) return null;
            if (r.error || !r.finding)
                return (
                    <p className="label-ops my-1 text-flag">
                        Hallazgo no encontrado.
                    </p>
                );
            // biome-ignore lint/suspicious/noExplicitAny: shape validated by handler
            return <EvidenceCard finding={r.finding as any} />;
        },
    });
}
