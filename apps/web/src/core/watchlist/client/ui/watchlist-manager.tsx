"use client";

import {
    MAX_TARGETS_PER_KIND,
    SWEEPS_PER_DAY,
    sweepBudgets,
    type WatchTargetKind,
} from "@centinela/contracts/watch";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
    useWatchlist,
    useWatchlistMutations,
    useWatchlists,
} from "@/core/watchlist/client/hooks";
import { HoverBorderGradient } from "@/frontend/components/aceternity/hover-border-gradient";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";
import { Spinner } from "@/frontend/components/ui/spinner";
import { cn } from "@/frontend/lib/utils";

/**
 * What each kind of target actually buys, in the user's terms. A contractor is
 * not a second-class entity: it is the cheap way to see awards in entities you
 * never watched.
 */
const KIND_COPY: Record<
    WatchTargetKind,
    { label: string; short: string; placeholder: string; blurb: string }
> = {
    contratante: {
        label: "Contratante",
        short: "Contratante",
        placeholder: "Nombre de la entidad",
        blurb: "Entidad que abre procesos. El agente trae sus convocatorias nuevas.",
    },
    contratista: {
        label: "Contratista",
        short: "Contratista",
        placeholder: "Nombre del contratista",
        blurb: "Empresa o persona que gana contratos. El agente lo sigue en TODAS las entidades del país, no solo en este frente.",
    },
};

function EntityEditor({ watchlistId }: { watchlistId: string }) {
    const { data } = useWatchlist(watchlistId);
    const { addEntity, removeEntity } = useWatchlistMutations();
    const [nit, setNit] = useState("");
    const [name, setName] = useState("");
    const [kind, setKind] = useState<WatchTargetKind>("contratante");
    const reduced = useReducedMotion();

    const add = () => {
        if (!nit.trim() || !name.trim()) return;
        addEntity.mutate(
            { watchlistId, body: { nit: nit.trim(), name: name.trim(), kind } },
            {
                onSuccess: () => {
                    toast.success(`${KIND_COPY[kind].label} agregado`);
                    setNit("");
                    setName("");
                },
                onError: () => toast.error("No se pudo agregar"),
            },
        );
    };

    return (
        <div className="space-y-3">
            <ul className="space-y-1.5">
                {data?.entities.map((e) => (
                    <motion.li
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-center justify-between gap-3 rounded-sm border border-rule bg-background px-3 py-2 text-sm transition-colors hover:border-signal/40"
                        initial={reduced ? false : { opacity: 0, y: 4 }}
                        key={e.id}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="flex min-w-0 items-baseline gap-2">
                            <span
                                aria-hidden
                                className={cn(
                                    "size-1.5 shrink-0 self-center rounded-full",
                                    e.kind === "contratista"
                                        ? "bg-flag"
                                        : "bg-signal",
                                )}
                            />
                            <span className="truncate font-medium">
                                {e.name}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                NIT {e.nit}
                            </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                            <span
                                className={cn(
                                    "label-ops hidden rounded-sm px-1.5 py-0.5 sm:inline",
                                    e.kind === "contratista"
                                        ? "bg-flag-soft text-flag"
                                        : "bg-signal-soft text-signal",
                                )}
                            >
                                {KIND_COPY[e.kind].short}
                            </span>
                            <Button
                                className="label-ops h-7 px-2 text-muted-foreground hover:text-flag"
                                onClick={() =>
                                    removeEntity.mutate({
                                        watchlistId,
                                        entityId: e.id,
                                    })
                                }
                                size="sm"
                                variant="ghost"
                            >
                                Quitar
                            </Button>
                        </span>
                    </motion.li>
                ))}
                {data && data.entities.length === 0 && (
                    <li className="rounded-sm border border-rule border-dashed px-3 py-2 text-muted-foreground text-sm">
                        Sin objetivos. Este frente no genera barridos todavía.
                    </li>
                )}
            </ul>
            <div className="space-y-1.5">
                <div className="flex flex-wrap gap-2">
                    <Select
                        onValueChange={(v) => setKind(v as WatchTargetKind)}
                        value={kind}
                    >
                        <SelectTrigger className="w-36 rounded-sm border-rule font-mono text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm border-rule font-mono text-xs">
                            <SelectItem value="contratante">
                                {KIND_COPY.contratante.label}
                            </SelectItem>
                            <SelectItem value="contratista">
                                {KIND_COPY.contratista.label}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        className="w-32 font-mono text-sm"
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="NIT"
                        value={nit}
                    />
                    <Input
                        className="min-w-40 flex-1"
                        onChange={(e) => setName(e.target.value)}
                        placeholder={KIND_COPY[kind].placeholder}
                        value={name}
                    />
                    <Button
                        className="label-ops"
                        disabled={addEntity.isPending}
                        onClick={add}
                    >
                        Agregar
                    </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {KIND_COPY[kind].blurb}
                </p>
            </div>
        </div>
    );
}

/**
 * What this frente costs per day, against the ceiling it shares.
 *
 * Croma caps every endpoint at 500 requests/24h, which caps how many targets can
 * be swept at all. Left invisible, the ceiling gets crossed silently and sweeps
 * start failing; stated, it turns into a decision about what is worth watching.
 *
 * The ceiling is per endpoint, so it is SHARED across every frente — this strip
 * shows one frente's draw on it, not a private allowance.
 */
function BudgetStrip({
    targets,
}: {
    targets: readonly { kind: WatchTargetKind }[];
}) {
    const budgets = sweepBudgets(targets);
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-rule bg-card px-3.5 py-2.5">
            <span className="label-ops text-muted-foreground">
                Costo de barrido
            </span>
            {(["contratante", "contratista"] as const).map((kind) => {
                const b = budgets[kind];
                return (
                    <span
                        className="flex items-baseline gap-1.5 font-mono text-[11px]"
                        key={kind}
                    >
                        <span className="text-muted-foreground">
                            {KIND_COPY[kind].short}
                        </span>
                        <span
                            className={cn(
                                "tabular-nums",
                                b.overBudget ? "text-flag" : "text-foreground",
                            )}
                        >
                            {b.used}/{b.ceiling}
                        </span>
                    </span>
                );
            })}
            <span className="font-mono text-[11px] text-muted-foreground">
                {SWEEPS_PER_DAY} barridos/día · tope compartido de{" "}
                {MAX_TARGETS_PER_KIND} por tipo (Croma: 500 req/24h por
                endpoint)
            </span>
        </div>
    );
}

export function WatchlistManager() {
    const { data: watchlists, isLoading } = useWatchlists();
    const { create, remove } = useWatchlistMutations();
    const [newName, setNewName] = useState("");
    const reduced = useReducedMotion();

    const createWl = () => {
        if (!newName.trim()) return;
        create.mutate(
            { name: newName.trim() },
            {
                onSuccess: () => {
                    toast.success("Frente creado");
                    setNewName("");
                },
                onError: () => toast.error("No se pudo crear"),
            },
        );
    };

    if (isLoading)
        return (
            <div className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
                <Spinner /> Cargando frentes…
            </div>
        );

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rule bg-card p-3">
                <Input
                    className="min-w-48 flex-1"
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") createWl();
                    }}
                    placeholder="Nuevo frente (ej. Salud Bogotá)"
                    value={newName}
                />
                <HoverBorderGradient
                    as="button"
                    className="label-ops bg-panel px-5 py-2.5 text-signal"
                    containerClassName="shrink-0"
                    maskClassName="bg-panel"
                    onClick={createWl}
                    {...(create.isPending ? { "aria-busy": true } : {})}
                >
                    Crear
                </HoverBorderGradient>
            </div>
            {watchlists?.map((wl, i) => (
                <FrenteSection
                    delay={reduced ? 0 : Math.min(i * 0.06, 0.3)}
                    id={wl.id}
                    key={wl.id}
                    name={wl.name}
                    onRemove={() =>
                        remove.mutate(wl.id, {
                            onSuccess: () => toast.success("Frente eliminado"),
                        })
                    }
                    reduced={Boolean(reduced)}
                />
            ))}
            {watchlists && watchlists.length === 0 && (
                <p className="rounded-lg border border-rule border-dashed bg-card px-4 py-8 text-center text-muted-foreground text-sm">
                    Crea tu primer frente para que el agente empiece a barrer.
                </p>
            )}
        </div>
    );
}

/** One frente: its targets and what they cost per sweep. */
function FrenteSection({
    delay,
    id,
    name,
    onRemove,
    reduced,
}: {
    delay: number;
    id: string;
    name: string;
    onRemove: () => void;
    reduced: boolean;
}) {
    const { data } = useWatchlist(id);
    return (
        <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-lg border border-rule bg-card"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1], delay }}
        >
            <header className="flex items-center justify-between gap-3 border-rule border-b bg-secondary/60 px-4 py-2.5">
                <div className="flex min-w-0 items-baseline gap-3">
                    <span className="label-ops text-muted-foreground">
                        Frente
                    </span>
                    <h2 className="truncate font-display font-semibold text-base text-foreground">
                        {name}
                    </h2>
                </div>
                <Button
                    className="label-ops h-7 shrink-0 px-2 text-muted-foreground hover:text-flag"
                    onClick={onRemove}
                    size="sm"
                    variant="ghost"
                >
                    Eliminar
                </Button>
            </header>
            <div className="space-y-3 p-4">
                <BudgetStrip targets={data?.entities ?? []} />
                <EntityEditor watchlistId={id} />
            </div>
        </motion.section>
    );
}
