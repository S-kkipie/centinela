"use client";

import { Button } from "@/frontend/components/ui/button";

/**
 * Route error boundary for /projects. `server.tsx` no longer awaits the
 * service — it hands the client `ProjectsTable` an unawaited `Promise.all`
 * wrapping `resolveResult(searchProjectsService(...))`. `React.use(promises)`
 * unwraps that promise on the client; if the service returned an error branch,
 * `resolveResult` rejected with an `AppErrorException`, which `React.use`
 * re-throws during render. This boundary is what catches that (and any other
 * param-parsing/rendering error in the route) and offers a retry instead of
 * white-screening.
 */
export default function ProjectsError({
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-6">
            <div className="space-y-1">
                <h2 className="font-semibold text-lg">Something went wrong</h2>
                <p className="text-muted-foreground text-sm">
                    We couldn’t load your projects. Please try again.
                </p>
            </div>
            <Button onClick={reset}>Retry</Button>
        </div>
    );
}
