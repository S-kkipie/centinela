"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    useWatchlist,
    useWatchlistMutations,
    useWatchlists,
} from "@/core/watchlist/client/hooks";
import { Button } from "@/frontend/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Spinner } from "@/frontend/components/ui/spinner";

function EntityEditor({ watchlistId }: { watchlistId: string }) {
    const { data } = useWatchlist(watchlistId);
    const { addEntity, removeEntity } = useWatchlistMutations();
    const [nit, setNit] = useState("");
    const [name, setName] = useState("");

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
                    <li
                        className="flex items-center justify-between gap-3 rounded-sm border border-rule bg-background px-3 py-1.5 text-sm"
                        key={e.id}
                    >
                        <span className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate font-medium">
                                {e.name}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                NIT {e.nit}
                            </span>
                        </span>
                        <Button
                            className="label-ops h-7 shrink-0 px-2 text-muted-foreground hover:text-flag"
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
                    </li>
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
        <div className="space-y-4">
            <div className="flex gap-2 rounded-md border border-rule bg-panel p-3">
                <Input
                    className="flex-1"
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nueva watchlist (ej. Bogotá salud)"
                    value={newName}
                />
                <Button
                    className="label-ops"
                    disabled={create.isPending}
                    onClick={createWl}
                >
                    Crear
                </Button>
            </div>
            {watchlists?.map((wl) => (
                <Card
                    className="gap-4 rounded-md border-rule py-0 shadow-none"
                    key={wl.id}
                >
                    <CardHeader className="border-b py-3 [.border-b]:pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="label-ops text-muted-foreground">
                                    Watchlist
                                </span>
                                <CardTitle className="truncate text-base">
                                    {wl.name}
                                </CardTitle>
                            </div>
                            <Button
                                className="label-ops h-7 shrink-0 px-2 text-muted-foreground hover:text-flag"
                                onClick={() =>
                                    remove.mutate(wl.id, {
                                        onSuccess: () =>
                                            toast.success("Eliminada"),
                                    })
                                }
                                size="sm"
                                variant="ghost"
                            >
                                Eliminar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <EntityEditor watchlistId={wl.id} />
                    </CardContent>
                </Card>
            ))}
            {watchlists && watchlists.length === 0 && (
                <p className="rounded-md border border-rule border-dashed bg-panel px-4 py-6 text-center text-muted-foreground text-sm">
                    Crea tu primera watchlist para que el agente empiece a
                    vigilar.
                </p>
            )}
        </div>
    );
}
