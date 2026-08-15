"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useCallback, useEffect, useRef } from "react";
import { analyzeConcentration } from "@/core/copilot/client/analysis/concentration";
import type {
    CentinelaDocument,
    DocumentKind,
} from "@/core/copilot/client/deliverables/documents";
import { buildDocument } from "@/core/copilot/client/deliverables/documents";
import { useCopilotUi } from "@/core/copilot/client/store";
import { resolveFinding } from "@/core/copilot/client/tools/finding-tools-core";
import {
    draftDenunciaParams,
    draftDocumentParams,
} from "@/core/copilot/client/tools/tool-params";
import { parseToolResult } from "@/core/copilot/client/tools/tool-result";
import { DocumentCard } from "@/core/copilot/client/ui/document-card";
import { useFindingsFeed, useGraph } from "@/core/finding/client/hooks";
import type { Finding } from "@/core/finding/domain/types";
import { useWatchlist } from "@/core/watchlist/client/hooks";

/**
 * The copilot's deliverables: dossier, derecho de petición, bid checklist and
 * watchdog thread.
 *
 * Everything else in the console explains. These four produce — a file the user
 * takes out of Centinela and uses. Each is built from the finding the agent
 * already grounded, so nothing in the document is invented by the model.
 */
export function useDocumentTools() {
    const { state, pushActivity } = useCopilotUi();
    const { data: feed } = useFindingsFeed();
    const watchlistId = state.selectedWatchlistId ?? undefined;
    const { data: graph } = useGraph(watchlistId);
    const { data: watchlist } = useWatchlist(watchlistId);

    // `useFrontendTool` registers its handler once, so a closure over `feed`
    // would freeze on the first (empty) render. Read through a live ref.
    const feedRef = useRef(feed);
    const graphRef = useRef(graph);
    const watchlistRef = useRef(watchlist);
    useEffect(() => {
        feedRef.current = feed;
        graphRef.current = graph;
        watchlistRef.current = watchlist;
    }, [feed, graph, watchlist]);

    const selectedFindingId = state.selectedFindingId;
    const selectedRef = useRef(selectedFindingId);
    useEffect(() => {
        selectedRef.current = selectedFindingId;
    }, [selectedFindingId]);

    /** Falls back to the finding open in the Informe — "haz el dossier de esto". */
    const resolve = useCallback((idOrQuery?: string): Finding | undefined => {
        const items = feedRef.current?.items ?? [];
        if (idOrQuery) return resolveFinding(items, idOrQuery);
        const open = selectedRef.current;
        return open ? items.find((f) => f.id === open) : items[0];
    }, []);

    const concentration = useCallback(() => {
        const flaggedFindingIds = new Set(
            (feedRef.current?.items ?? [])
                .filter((f) => f.kind === "BANDERA_ROJA")
                .map((f) => f.id),
        );
        const watchedNits = new Set(
            (watchlistRef.current?.entities ?? []).map((e) => e.nit),
        );
        return analyzeConcentration(graphRef.current?.edges ?? [], {
            watchedNits,
            flaggedFindingIds,
        });
    }, []);

    const build = useCallback(
        (
            kind: DocumentKind,
            args: { findingId?: string; requesterName?: string },
        ): { document: CentinelaDocument } | { error: string } => {
            const finding = resolve(args.findingId);
            if (!finding) return { error: "hallazgo no encontrado" };
            const document = buildDocument(kind, finding, {
                generatedAt: new Date().toISOString(),
                concentration: concentration(),
                requesterName: args.requesterName ?? null,
            });
            return { document };
        },
        [resolve, concentration],
    );

    useDocumentTool({
        build,
        description:
            "Genera un dossier de evidencia descargable (.md) de un hallazgo: veredicto, cadena de evidencia con enlaces a las fuentes oficiales y concentración de adjudicaciones. Úsalo para 'exporta esto', 'pásame el informe en archivo', 'necesito la evidencia para pasarla a alguien'. Sin findingId toma el hallazgo abierto.",
        kind: "dossier",
        name: "exportDossier",
        params: draftDocumentParams,
        pushActivity,
    });

    useDocumentTool({
        build,
        description:
            "Redacta el borrador de un derecho de petición (Ley 1755 de 2015) dirigido a la entidad contratante sobre un proceso con bandera roja, con los hechos, la evidencia citada y las peticiones concretas de información. Úsalo para 'quiero denunciar esto', 'cómo lo reclamo', 'redáctame la petición'. Recuerda al usuario que es un borrador que debe completar y radicar él.",
        kind: "denuncia",
        name: "draftDenuncia",
        params: draftDenunciaParams,
        pushActivity,
    });

    useDocumentTool({
        build,
        description:
            "Genera el checklist para presentarse a una OPORTUNIDAD: requisitos habilitantes jurídicos, financieros y técnicos, más los pasos previos a radicar la oferta. Úsalo para '¿qué necesito para presentarme?', 'quiero competir por este', 'prepárame la propuesta'.",
        kind: "propuesta",
        name: "draftPropuesta",
        params: draftDocumentParams,
        pushActivity,
    });

    useDocumentTool({
        build,
        description:
            "Redacta un hilo para redes sociales sobre una bandera roja, numerado, con las cifras del hallazgo y los enlaces a las fuentes. Úsalo para 'esto hay que hacerlo público', 'escríbeme el hilo', 'cómo lo cuento'.",
        kind: "hilo",
        name: "draftHilo",
        params: draftDocumentParams,
        pushActivity,
    });
}

const ACTIVITY_LABEL: Record<DocumentKind, string> = {
    dossier: "Dossier generado",
    denuncia: "Borrador de derecho de petición generado",
    propuesta: "Checklist de propuesta generado",
    hilo: "Hilo generado",
};

/**
 * One document tool. Called a fixed number of times in a fixed order from
 * `useDocumentTools`, so the hook rules hold.
 */
function useDocumentTool({
    build,
    description,
    kind,
    name,
    params,
    pushActivity,
}: {
    build: (
        kind: DocumentKind,
        args: { findingId?: string; requesterName?: string },
    ) => { document: CentinelaDocument } | { error: string };
    description: string;
    kind: DocumentKind;
    name: string;
    params: typeof draftDocumentParams | typeof draftDenunciaParams;
    pushActivity: ReturnType<typeof useCopilotUi>["pushActivity"];
}) {
    useFrontendTool(
        {
            name,
            description,
            parameters: params,
            handler: async (args) => {
                const result = build(kind, args ?? {});
                if ("error" in result) return result;
                pushActivity({
                    kind: "copiloto",
                    text: `${ACTIVITY_LABEL[kind]}: ${result.document.title}.`,
                });
                return result;
            },
            render: ({ result }) => {
                const r = parseToolResult<{ document: CentinelaDocument }>(
                    result,
                );
                if (!r) return null; // still running
                if (r.error || !r.document)
                    return (
                        <p className="label-ops my-1 text-flag">
                            No pude generar el documento: hallazgo no
                            encontrado.
                        </p>
                    );
                return <DocumentCard document={r.document} />;
            },
        },
        [build, kind, name, pushActivity],
    );
}
