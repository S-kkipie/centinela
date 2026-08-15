"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useMemo, useReducer } from "react";
import {
    addEntitiesToWatchlistParams,
    type ConfirmResult,
    canCancel,
    canConfirm,
    confirmAddEntities,
    confirmProposeWatchlist,
    confirmSummary,
    hitlReducer,
    initialHitlState,
    proposeWatchlistParams,
    type WatchlistEntityInput,
    type WatchlistWriteDeps,
} from "@/core/copilot/client/tools/watchlist-tools-core";
import {
    WatchlistPreviewCard,
    WatchlistPreviewSkeleton,
} from "@/core/copilot/client/ui/watchlist-preview-card";
import { useWatchlistMutations } from "@/core/watchlist/client/hooks";

/**
 * Card wired to the confirm/cancel/pending state machine. Owns local state so a
 * double-click on Confirmar is a guarded no-op — the second click never reaches
 * `execute`/`respond`.
 */
function HitlConfirmCard({
    name,
    heading,
    entities,
    execute,
    respond,
}: {
    name?: string;
    heading: string;
    entities: WatchlistEntityInput[];
    execute: () => Promise<ConfirmResult>;
    respond: (result: unknown) => Promise<void>;
}) {
    const [state, dispatch] = useReducer(hitlReducer, initialHitlState);

    const onConfirm = async () => {
        if (!canConfirm(state)) return;
        dispatch({ type: "confirm" });
        const result = await execute();
        if (result.ok) {
            dispatch({ type: "resolved" });
            await respond(confirmSummary(result));
        } else {
            dispatch({ type: "failed", error: result.error });
            await respond({ error: result.error });
        }
    };

    const onCancel = async () => {
        if (!canCancel(state)) return;
        dispatch({ type: "cancel" });
        await respond({ cancelled: true });
    };

    return (
        <WatchlistPreviewCard
            entities={entities}
            error={state.error}
            heading={heading}
            name={name}
            onCancel={onCancel}
            onConfirm={onConfirm}
            pending={state.phase === "pending"}
        />
    );
}

function completeLine(result: string) {
    return <p className="label-ops my-1 text-signal">{result}</p>;
}

/**
 * Copilot human-in-the-loop tools over watchlists. Registers `proposeWatchlist`
 * (create a new vigilada) and `addEntitiesToWatchlist` (extend an existing one).
 * Both pause the agent on a preview card until the user confirms; nothing is
 * written until then. Mount once inside the authenticated tree (the orchestrator
 * wires it into use-centinela-copilot); inert until then.
 */
export function useWatchlistTools() {
    const { create, addEntity } = useWatchlistMutations();

    const deps = useMemo<WatchlistWriteDeps>(
        () => ({
            createWatchlist: (body) => create.mutateAsync(body),
            addEntity: (args) => addEntity.mutateAsync(args),
        }),
        [create, addEntity],
    );

    useHumanInTheLoop({
        name: "proposeWatchlist",
        description:
            "Propón crear una nueva vigilada (watchlist) con entidades a vigilar. " +
            "Cada entidad necesita su NIT y nombre. NO inventes NITs: si no tienes " +
            "un NIT fundado en la conversación o el contexto, pregúntaselo al " +
            "usuario antes de llamar esta herramienta. No se escribe nada hasta que " +
            "el usuario confirme en la tarjeta.",
        parameters: proposeWatchlistParams,
        render: (props) => {
            if (typeof props.respond === "function") {
                return (
                    <HitlConfirmCard
                        entities={props.args.entities}
                        execute={() =>
                            confirmProposeWatchlist(props.args, deps)
                        }
                        heading="Vigilada propuesta"
                        name={props.args.name}
                        respond={props.respond}
                    />
                );
            }
            if (typeof props.result === "string") {
                return completeLine(props.result);
            }
            return <WatchlistPreviewSkeleton />;
        },
    });

    useHumanInTheLoop({
        name: "addEntitiesToWatchlist",
        description:
            "Agrega entidades a una vigilada (watchlist) existente. Recibe el " +
            "watchlistId y las entidades (NIT + nombre). NO inventes NITs: pídelos " +
            "al usuario si no los tienes. No se escribe nada hasta que el usuario " +
            "confirme en la tarjeta.",
        parameters: addEntitiesToWatchlistParams,
        render: (props) => {
            if (typeof props.respond === "function") {
                return (
                    <HitlConfirmCard
                        entities={props.args.entities}
                        execute={() => confirmAddEntities(props.args, deps)}
                        heading="Agregar a vigilada"
                        respond={props.respond}
                    />
                );
            }
            if (typeof props.result === "string") {
                return completeLine(props.result);
            }
            return <WatchlistPreviewSkeleton />;
        },
    });
}
