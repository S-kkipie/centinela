/** biome-ignore-all lint/suspicious/noExplicitAny: Hono types are not fully compatible with TypeScript */
"use client";

import type {
    MutationFunctionContext,
    QueryKey,
    UseMutationOptions,
} from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import type {
    DecorateMutationProcedure,
    EdenFetchError,
    inferError,
    inferInput,
    inferOutput,
    RouteDefinition,
} from "eden-tanstack-react-query";
import { useRouter } from "next/navigation";

/**
 * Extracts the mutation options type for an Eden mutation procedure.
 *
 * Produces TanStack Query mutation options (minus mutationFn and mutationKey)
 * with input/output/error types inferred from the decorated Eden route.
 *
 * @template TProc - Decorated Eden mutation procedure
 * @template TContext - Context type returned from onMutate
 */
export type EdenMutationOpts<
    TProc extends DecorateMutationProcedure<RouteDefinition>,
    TContext = unknown,
> = Omit<
    UseMutationOptions<
        inferOutput<TProc>,
        EdenFetchError<number, inferError<TProc>>,
        inferInput<TProc>,
        TContext
    >,
    "mutationFn" | "mutationKey"
>;

/**
 * Mutation helper with automatic cache invalidation + router refresh.
 *
 * Wraps mutation options to add automatic query invalidation and
 * router refresh on success. Generic over an Eden mutation procedure
 * so input/output/error types propagate correctly.
 *
 * @param baseOptions - Base mutation options without mutationFn/mutationKey
 * @param queryKey - Query key to invalidate on success
 * @returns Mutation options with automatic refresh on success
 */
export function useMutationWithRefreshEden<
    TProc extends DecorateMutationProcedure<RouteDefinition>,
    TContext = unknown,
>(
    baseOptions: EdenMutationOpts<TProc, TContext>,
    queryKey: QueryKey,
): EdenMutationOpts<TProc, TContext> {
    const queryClient = useQueryClient();
    const router = useRouter();

    return {
        ...baseOptions,

        onSuccess: async (
            data,
            variables,
            onMutateResult,
            context: MutationFunctionContext,
        ) => {
            await baseOptions.onSuccess?.(
                data,
                variables,
                onMutateResult,
                context,
            );

            await queryClient.invalidateQueries({ queryKey });
            router.refresh();
        },
    };
}
