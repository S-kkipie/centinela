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
            <ul className="space-y-1">
                {data?.entities.map((e) => (
                    <li
                        className="flex items-center justify-between rounded border px-3 py-1.5 text-sm"
                        key={e.id}
                    >
                        <span>
                            <span className="font-medium">{e.name}</span>{" "}
                            <span className="font-mono text-muted-foreground text-xs">
                                {e.nit}
                            </span>
                        </span>
                        <Button
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
                    <li className="text-muted-foreground text-sm">
                        Sin entidades vigiladas.
                    </li>
                )}
            </ul>
            <div className="flex gap-2">
                <Input
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="NIT"
                    value={nit}
                />
                <Input
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre entidad"
                    value={name}
                />
                <Button disabled={addEntity.isPending} onClick={add}>
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
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Spinner /> Cargando watchlists…
            </div>
        );

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nueva watchlist (ej. Bogotá salud)"
                    value={newName}
                />
                <Button disabled={create.isPending} onClick={createWl}>
                    Crear
                </Button>
            </div>
            {watchlists?.map((wl) => (
                <Card key={wl.id}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                {wl.name}
                            </CardTitle>
                            <Button
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
                    <CardContent>
                        <EntityEditor watchlistId={wl.id} />
                    </CardContent>
                </Card>
            ))}
            {watchlists && watchlists.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    Crea tu primera watchlist para que el agente empiece a
                    vigilar.
                </p>
            )}
        </div>
    );
}
