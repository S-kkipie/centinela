import { WatchlistManager } from "@/core/watchlist/client/ui/watchlist-manager";
import { requireAuth } from "@/server/auth/require-auth";

export default async function WatchlistsPage() {
    await requireAuth();
    return (
        <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
            <div>
                <h1 className="font-semibold text-xl">Watchlists</h1>
                <p className="text-muted-foreground text-sm">
                    Entidades contratantes que el agente vigila.
                </p>
            </div>
            <WatchlistManager />
        </div>
    );
}
