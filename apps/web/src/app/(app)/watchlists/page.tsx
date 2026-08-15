import { WatchlistManager } from "@/core/watchlist/client/ui/watchlist-manager";
import { requireAuth } from "@/server/auth/require-auth";

export default async function WatchlistsPage() {
    await requireAuth();
    return (
        <div className="mx-auto w-full max-w-3xl space-y-5 p-6">
            <div className="space-y-1.5">
                <p className="label-ops text-signal">Vigilancia · Entidades</p>
                <h1 className="font-display font-semibold text-xl">
                    Watchlists
                </h1>
                <p className="text-muted-foreground text-sm">
                    Entidades contratantes que el agente vigila.
                </p>
            </div>
            <WatchlistManager />
        </div>
    );
}
