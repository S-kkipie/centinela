"use client";

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
import { Spinner } from "@/frontend/components/ui/spinner";

function EntityEditor({ watchlistId }: { watchlistId: string }) {
    const { data } = useWatchlist(watchlistId);
    const { addEntity, removeEntity } = useWatchlistMutations();
    const [nit, setNit] = useState("");
    const [name, setName] = useState("");
    const reduced = useReducedMotion();

    const add = () => {
        if (!nit.trim() || !name.trim()) return;
        addEntity.mutate(
            { watchlistId, body: { nit: nit.trim(), name: name.trim() } },
            {
                onSuccess: () => {
                    toast.success("Entidad agregada");
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
                                className="size-1.5 shrink-0 self-center rounded-full bg-signal"
                            />
                            <span className="truncate font-medium">
                                {e.name}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                NIT {e.nit}
                            </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                            <span className="label-ops hidden text-signal sm:inline">
                                Vigilando
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
                        Sin entidades vigiladas.
                    </li>
                )}
            </ul>
            <div className="flex flex-wrap gap-2">
                <Input
                    className="w-32 font-mono text-sm"
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="NIT"
                    value={nit}
                />
                <Input
                    className="min-w-40 flex-1"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre entidad"
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
                    toast.success("Watchlist creada");
                    setNewName("");
                },
                onError: () => toast.error("No se pudo crear"),
            },
        );
    };

    if (isLoading)
        return (
            <div className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
                <Spinner /> Cargando watchlists…
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
                    placeholder="Nueva watchlist (ej. Bogotá salud)"
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
                <motion.section
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-lg border border-rule bg-card"
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    key={wl.id}
                    transition={{
                        duration: 0.24,
                        ease: [0.16, 1, 0.3, 1],
                        delay: reduced ? 0 : Math.min(i * 0.06, 0.3),
                    }}
                >
                    <header className="flex items-center justify-between gap-3 border-rule border-b bg-secondary/60 px-4 py-2.5">
                        <div className="flex min-w-0 items-baseline gap-3">
                            <span className="label-ops text-muted-foreground">
                                Watchlist
                            </span>
                            <h2 className="truncate font-display font-semibold text-base text-foreground">
                                {wl.name}
                            </h2>
                        </div>
                        <Button
                            className="label-ops h-7 shrink-0 px-2 text-muted-foreground hover:text-flag"
                            onClick={() =>
                                remove.mutate(wl.id, {
                                    onSuccess: () => toast.success("Eliminada"),
                                })
                            }
                            size="sm"
                            variant="ghost"
                        >
                            Eliminar
                        </Button>
                    </header>
                    <div className="p-4">
                        <EntityEditor watchlistId={wl.id} />
                    </div>
                </motion.section>
            ))}
            {watchlists && watchlists.length === 0 && (
                <p className="rounded-lg border border-rule border-dashed bg-card px-4 py-8 text-center text-muted-foreground text-sm">
                    Crea tu primera watchlist para que el agente empiece a
                    vigilar.
                </p>
            )}
        </div>
    );
}
