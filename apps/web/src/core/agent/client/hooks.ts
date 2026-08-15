"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/frontend/lib/eden";

export type SweepOutcome = {
    enqueued: number;
    detected: number;
    targets: number;
};

/** Error carrying the API status so callers can special-case "no targets" (400). */
export class SweepError extends Error {
    constructor(readonly status: number) {
        super(`sweep failed: ${status}`);
    }
}

const agent = apiClient.api.v1.agent;

/**
 * Fires a manual heartbeat for the signed-in user's agent. On success the feed
 * is invalidated so freshly-enqueued findings surface as soon as they persist.
 */
export function useTriggerSweep() {
    const qc = useQueryClient();
    return useMutation<SweepOutcome>({
        mutationFn: async () => {
            const { data, error } = await agent.sweep.post();
            if (error) throw new SweepError(error.status);
            return data.response;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["findings"] });
        },
    });
}
