import {
    defaultShouldDehydrateQuery,
    isServer,
    QueryClient,
} from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { staleTime: 5000, throwOnError: true },
            dehydrate: {
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === "pending",
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
    if (isServer) return makeQueryClient();
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}
