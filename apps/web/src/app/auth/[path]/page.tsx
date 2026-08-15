import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";
import { Auth } from "@/frontend/components/auth/auth";
import { BrandMark } from "@/frontend/components/brand/brand-mark";

// Auth views read live session/query state via `useAuth()`, so this route
// can't be statically prerendered.
export const dynamic = "force-dynamic";

export default async function AuthPage({
    params,
}: {
    params: Promise<{ path: string }>;
}) {
    const { path } = await params;
    if (!Object.values(viewPaths.auth).includes(path)) {
        notFound();
    }

    return (
        <main className="bg-grid-ops relative flex min-h-svh flex-col items-center justify-center p-4">
            <div className="flex w-full max-w-sm flex-col items-center">
                <div className="mb-6 flex flex-col items-center gap-2">
                    <BrandMark className="size-10 text-foreground" />
                    <span className="label-ops text-signal">
                        Acceso · Consola del agente
                    </span>
                    <span className="font-display font-semibold text-2xl text-foreground tracking-tight">
                        CENTINELA<span className="text-signal">_</span>
                    </span>
                </div>
                <Auth className="border-rule shadow-none" path={path} />
                <p className="label-ops mt-6 text-muted-foreground">
                    Vigilancia de contratación pública · Colombia
                </p>
            </div>
        </main>
    );
}
