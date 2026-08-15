/**
 * Pure logic behind the watchlist HITL tools — kept .ts (no React, no
 * CopilotKit) so vitest's node-environment suite covers it directly.
 *
 * The copilot proposes a watchlist in chat; nothing is written until the user
 * clicks Confirmar in the preview card. These helpers cover param validation,
 * the payload shape the existing watchlist mutations expect, the confirm/cancel/
 * pending state machine that guards double-clicks, and the executors that run
 * the mutations.
 */

import {
    DEFAULT_WATCH_TARGET_KIND,
    WATCH_TARGET_KINDS,
    type WatchTargetKind,
} from "@centinela/contracts/watch";
import { z } from "zod";

export const watchlistEntityInputSchema = z.object({
    nit: z.string().trim().min(1).max(50),
    entityName: z.string().trim().min(1).max(200),
    // Defaulted, so a model that omits it still produces a valid contracting
    // entity rather than failing validation.
    kind: z
        .enum(WATCH_TARGET_KINDS)
        .default(DEFAULT_WATCH_TARGET_KIND)
        .describe(
            "contratante = entidad que abre procesos; contratista = empresa o persona que los gana",
        ),
});
export type WatchlistEntityInput = z.infer<typeof watchlistEntityInputSchema>;

export const proposeWatchlistParams = z.object({
    name: z.string().trim().min(1).max(200),
    entities: z.array(watchlistEntityInputSchema).min(1),
});
export type ProposeWatchlistParams = z.infer<typeof proposeWatchlistParams>;

export const addEntitiesToWatchlistParams = z.object({
    watchlistId: z.string().min(1),
    entities: z.array(watchlistEntityInputSchema).min(1),
});
export type AddEntitiesToWatchlistParams = z.infer<
    typeof addEntitiesToWatchlistParams
>;

/** Body for `useWatchlistMutations().create` (CreateWatchlist). */
export function toCreateWatchlistBody(params: { name: string }): {
    name: string;
} {
    return { name: params.name.trim() };
}

/**
 * Bodies for `useWatchlistMutations().addEntity`. The tool speaks `entityName`
 * (clearer for the LLM); the mutation speaks `name` (AddWatchlistEntity).
 */
export function toAddEntityBodies(
    entities: WatchlistEntityInput[],
): Array<{ nit: string; name: string; kind: WatchTargetKind }> {
    return entities.map((e) => ({
        nit: e.nit.trim(),
        name: e.entityName.trim(),
        kind: e.kind ?? DEFAULT_WATCH_TARGET_KIND,
    }));
}

/** Injected mutations — the tsx hook wires these to react-query mutateAsync. */
export interface WatchlistWriteDeps {
    createWatchlist(body: {
        name: string;
    }): Promise<{ id: string; name: string }>;
    addEntity(args: {
        watchlistId: string;
        body: { nit: string; name: string; kind: WatchTargetKind };
    }): Promise<unknown>;
}

export type ConfirmResult =
    | { ok: true; watchlistId: string; name?: string; entityCount: number }
    | { ok: false; error: string };

function errorMessage(e: unknown): string {
    return e instanceof Error ? e.message : "error desconocido";
}

/**
 * Confirm path for `proposeWatchlist`: create the watchlist, then add each
 * entity to it. Never throws — failures come back as `{ ok:false, error }` so
 * the tool can respond and the agent can apologize in Spanish.
 */
export async function confirmProposeWatchlist(
    params: ProposeWatchlistParams,
    deps: WatchlistWriteDeps,
): Promise<ConfirmResult> {
    try {
        const created = await deps.createWatchlist(
            toCreateWatchlistBody(params),
        );
        const bodies = toAddEntityBodies(params.entities);
        for (const body of bodies) {
            await deps.addEntity({ watchlistId: created.id, body });
        }
        return {
            ok: true,
            watchlistId: created.id,
            name: created.name,
            entityCount: bodies.length,
        };
    } catch (e) {
        return { ok: false, error: errorMessage(e) };
    }
}

/** Confirm path for `addEntitiesToWatchlist`: extend an existing watchlist. */
export async function confirmAddEntities(
    params: AddEntitiesToWatchlistParams,
    deps: Pick<WatchlistWriteDeps, "addEntity">,
): Promise<ConfirmResult> {
    try {
        const bodies = toAddEntityBodies(params.entities);
        for (const body of bodies) {
            await deps.addEntity({ watchlistId: params.watchlistId, body });
        }
        return {
            ok: true,
            watchlistId: params.watchlistId,
            entityCount: bodies.length,
        };
    } catch (e) {
        return { ok: false, error: errorMessage(e) };
    }
}

// --- Confirm / cancel / pending state machine -----------------------------
// Guards the HITL card: a click only fires from `idle`, so a double-click on
// Confirmar (or Cancelar) cannot write twice or race the first write.

export type HitlPhase =
    | "idle"
    | "pending"
    | "confirmed"
    | "cancelled"
    | "error";
export type HitlState = { phase: HitlPhase; error?: string };
export const initialHitlState: HitlState = { phase: "idle" };

export type HitlAction =
    | { type: "confirm" }
    | { type: "resolved" }
    | { type: "failed"; error: string }
    | { type: "cancel" };

export function hitlReducer(state: HitlState, action: HitlAction): HitlState {
    switch (action.type) {
        case "confirm":
            return state.phase === "idle" ? { phase: "pending" } : state;
        case "resolved":
            return state.phase === "pending" ? { phase: "confirmed" } : state;
        case "failed":
            return state.phase === "pending"
                ? { phase: "error", error: action.error }
                : state;
        case "cancel":
            return state.phase === "idle" ? { phase: "cancelled" } : state;
        default:
            return state;
    }
}

/** Only an idle card may confirm — everything else is a guarded no-op. */
export function canConfirm(state: HitlState): boolean {
    return state.phase === "idle";
}

/** Only an idle card may cancel. */
export function canCancel(state: HitlState): boolean {
    return state.phase === "idle";
}

/** Spanish (es-CO) summary the tool responds with once settled. */
export function confirmSummary(result: ConfirmResult): string {
    if (!result.ok) {
        return `No se pudo completar la operación: ${result.error}`;
    }
    const n = result.entityCount;
    const ent = n === 1 ? "1 objetivo" : `${n} objetivos`;
    return result.name
        ? `Frente "${result.name}" creado con ${ent}.`
        : `${ent} agregado${n === 1 ? "" : "s"} al frente.`;
}
