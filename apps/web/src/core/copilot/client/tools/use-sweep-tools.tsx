"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { useTriggerSweep } from "@/core/agent/client/hooks";
import { useCopilotUi } from "@/core/copilot/client/store";

/**
 * `runSweep` — lets the user tell the copilot "barre ahora" instead of waiting
 * for the two-hour heartbeat. Runs the same manual sweep as the dashboard
 * button, and writes the outcome to the activity ticker so the agent's action
 * is visible.
 */
export function useSweepTools() {
    const sweep = useTriggerSweep();
    const { pushActivity } = useCopilotUi();

    useFrontendTool(
        {
            name: "runSweep",
            description:
                "Lanza un barrido AHORA sobre los objetivos del usuario (no espera al ciclo de 2 horas). Úsalo cuando el usuario diga 'barre ya', 'busca ahora', 'revisa de una' o quiera ver hallazgos sin esperar. Requiere que exista al menos un frente con una entidad.",
            parameters: z.object({}),
            handler: async () => {
                try {
                    const r = await sweep.mutateAsync();
                    pushActivity({
                        kind: r.enqueued > 0 ? "bandera" : "barrido",
                        text:
                            r.enqueued > 0
                                ? `Barrido manual: ${r.enqueued} proceso(s) en investigación.`
                                : `Barrido manual sobre ${r.targets} objetivo(s): sin procesos nuevos.`,
                    });
                    return {
                        ok: true,
                        enqueued: r.enqueued,
                        detected: r.detected,
                        targets: r.targets,
                    };
                } catch {
                    return {
                        ok: false,
                        error: "No pude lanzar el barrido. ¿Ya tienes un frente con una entidad?",
                    };
                }
            },
            render: () => (
                <p className="label-ops my-1 text-muted-foreground">
                    {sweep.isPending
                        ? "Barriendo el SECOP…"
                        : "Barrido solicitado."}
                </p>
            ),
        },
        [sweep, pushActivity],
    );
}
