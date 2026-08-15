"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useCopilotUi } from "@/core/copilot/client/store";
import { openNetworkParams } from "@/core/copilot/client/tools/tool-params";

/**
 * Opens the contractor network as an overlay.
 *
 * The graph used to be the last section of the dashboard, so "look at the
 * network" meant "scroll past everything and hope". This tool puts it on screen
 * in one call, optionally centred on a NIT or scoped to one finding.
 */
export function useNetworkTools() {
    const ui = useCopilotUi();

    useFrontendTool(
        {
            name: "openNetwork",
            description:
                "Abre la red de contratistas en pantalla completa. Úsalo cuando el usuario quiera VER la red, los vínculos entre NITs o quién está conectado con quién. Puedes centrarla en un NIT y/o acotarla a las relaciones de un hallazgo. Prefiere esta herramienta antes que describir la red con palabras.",
            parameters: openNetworkParams,
            handler: async ({ nit, findingId }) => {
                ui.openNetwork({ nit: nit ?? undefined, findingId });
                ui.pushActivity({
                    kind: "copiloto",
                    text: nit
                        ? `Red abierta y centrada en ${nit}.`
                        : "Red de contratistas abierta.",
                });
                return {
                    opened: true,
                    ...(nit ? { centeredOn: nit } : {}),
                    ...(findingId ? { scopedTo: findingId } : {}),
                };
            },
            render: ({ args }) => (
                <p className="label-ops my-1 text-muted-foreground">
                    {args?.nit
                        ? `Abriendo la red en ${args.nit}…`
                        : "Abriendo la red de contratistas…"}
                </p>
            ),
        },
        [ui],
    );
}
