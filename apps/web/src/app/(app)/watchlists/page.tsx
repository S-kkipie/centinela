import { WatchlistManager } from "@/core/watchlist/client/ui/watchlist-manager";
import { ConsolaShader } from "@/frontend/components/aceternity/shader-fields";
import { requireAuth } from "@/server/auth/require-auth";

export default async function WatchlistsPage() {
    await requireAuth();
    return (
        <div className="bg-grid-ops">
            <section className="relative border-rule border-b bg-secondary">
                <ConsolaShader />
                <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-8 pb-6 md:px-6">
                    <p className="label-ops text-signal">
                        Vigilancia · Entidades
                    </p>
                    <h1 className="mt-1.5 font-display font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
                        Entidades vigiladas
                    </h1>
                    <p className="mt-1.5 max-w-[52ch] text-muted-foreground text-sm">
                        Dile al agente qué entidades contratantes vigilar. Cada
                        barrido cruza sus procesos nuevos contra las 9 fuentes
                        oficiales.
                    </p>
                </div>
            </section>
            <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
                <WatchlistManager />
            </div>
        </div>
    );
}
