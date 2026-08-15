import Link from "next/link";
import type { PropsWithChildren } from "react";
import { requireAuth } from "@/server/auth/require-auth";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: PropsWithChildren) {
    const { user } = await requireAuth();
    return (
        <div className="min-h-svh bg-background">
            <header className="sticky top-0 z-40 border-rule border-b bg-panel">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
                    <div className="flex min-w-0 items-center gap-5">
                        <Link
                            className="font-display font-semibold text-foreground text-sm tracking-tight"
                            href="/dashboard"
                        >
                            CENTINELA
                        </Link>
                        <span
                            aria-hidden
                            className="hidden h-4 w-px bg-rule sm:block"
                        />
                        <nav className="flex items-center gap-4">
                            <Link
                                className="label-ops text-muted-foreground transition-colors hover:text-foreground"
                                href="/dashboard"
                            >
                                Panel
                            </Link>
                            <Link
                                className="label-ops text-muted-foreground transition-colors hover:text-foreground"
                                href="/watchlists"
                            >
                                Vigiladas
                            </Link>
                        </nav>
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="label-ops flex items-center gap-1.5 whitespace-nowrap text-signal">
                            <span
                                aria-hidden
                                className="size-1.5 rounded-full bg-signal motion-safe:animate-pulse"
                            />
                            En vivo
                        </span>
                        <span
                            className="hidden max-w-48 truncate font-mono text-[11px] text-muted-foreground md:inline"
                            title={user.email}
                        >
                            {user.email}
                        </span>
                        <SignOutButton />
                    </div>
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
