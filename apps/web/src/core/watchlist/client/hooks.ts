"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
    AddWatchlistEntity,
    CreateWatchlist,
    Watchlist,
    WatchlistWithEntities,
} from "@/core/watchlist/domain/types";
import { apiClient } from "@/frontend/lib/eden";

const wl = apiClient.api.v1.watchlists;

export function useWatchlists() {
    return useQuery<Watchlist[]>({
        queryKey: ["watchlists"],
        queryFn: async () => {
            const { data, error } = await wl.get();
            if (error) throw new Error(`watchlists failed: ${error.status}`);
            return data.response;
        },
    });
}

export function useWatchlist(id: string | undefined) {
    return useQuery<WatchlistWithEntities>({
        queryKey: ["watchlist", id],
        enabled: Boolean(id),
        queryFn: async () => {
            const { data, error } = await wl({ id: id as string }).get();
            if (error) throw new Error(`watchlist failed: ${error.status}`);
            return data.response;
        },
    });
}

export function useWatchlistMutations() {
    const qc = useQueryClient();
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ["watchlists"] });
        qc.invalidateQueries({ queryKey: ["watchlist"] });
    };

    const create = useMutation({
        mutationFn: async (body: CreateWatchlist) => {
            const { data, error } = await wl.post(body);
            if (error) throw new Error(`create failed: ${error.status}`);
            return data.response;
        },
        onSuccess: invalidate,
    });

    const remove = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await wl({ id }).delete();
            if (error) throw new Error(`delete failed: ${error.status}`);
            return data.response;
        },
        onSuccess: invalidate,
    });

    const addEntity = useMutation({
        mutationFn: async (args: {
            watchlistId: string;
            body: AddWatchlistEntity;
        }) => {
            const { data, error } = await wl({
                id: args.watchlistId,
            }).entities.post(args.body);
            if (error) throw new Error(`add entity failed: ${error.status}`);
            return data.response;
        },
        onSuccess: invalidate,
    });

    const removeEntity = useMutation({
        mutationFn: async (args: { watchlistId: string; entityId: string }) => {
            const { data, error } = await wl({ id: args.watchlistId })
                .entities({ entityId: args.entityId })
                .delete();
            if (error) throw new Error(`remove entity failed: ${error.status}`);
            return data.response;
        },
        onSuccess: invalidate,
    });

    return { create, remove, addEntity, removeEntity };
}
