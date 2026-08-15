"use client";

import { useQuery } from "@tanstack/react-query";
import type { Graph, PaginatedFindings } from "@/core/finding/domain/types";
import { apiClient } from "@/frontend/lib/eden";

const feed = apiClient.api.v1.findings;
const graph = apiClient.api.v1.graph;

/**
 * The live findings feed. Polls every `intervalMs` so the dashboard shows the
 * agent's new findings without a manual refresh (WebSocket `useAgent` lands
 * later). Optionally scoped to one watchlist.
 */
export function useFindingsFeed(
    params: { watchlistId?: string } = {},
    intervalMs = 5000,
) {
    return useQuery<PaginatedFindings>({
        queryKey: ["findings", params.watchlistId ?? "all"],
        queryFn: async () => {
            const { data, error } = await feed.get({
                query: {
                    page: 1,
                    perPage: 50,
                    sort: [],
                    kind: [],
                    watchlistId: params.watchlistId ?? "",
                },
            });
            if (error) throw new Error(`feed failed: ${error.status}`);
            return data.response;
        },
        refetchInterval: intervalMs,
    });
}

/** Contractor-network graph edges for a watchlist. Polls alongside the feed. */
export function useGraph(watchlistId: string | undefined, intervalMs = 5000) {
    return useQuery<Graph>({
        queryKey: ["graph", watchlistId],
        enabled: Boolean(watchlistId),
        queryFn: async () => {
            const { data, error } = await graph.get({
                query: { watchlistId: watchlistId as string },
            });
            if (error) throw new Error(`graph failed: ${error.status}`);
            return data.response;
        },
        refetchInterval: intervalMs,
    });
}
