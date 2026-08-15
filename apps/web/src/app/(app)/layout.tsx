import Link from "next/link";
import type { PropsWithChildren } from "react";
import { requireAuth } from "@/server/auth/require-auth";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: PropsWithChildren) {
    const { user } = await requireAuth();
    return (
        <div className="min-h-svh">
            <header className="flex items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-6">
                    <span className="font-semibold">Centinela</span>
                    <nav className="flex items-center gap-4 text-muted-foreground text-sm">
                        <Link
                            className="hover:text-foreground"
                            href="/dashboard"
                        >
                            Dashboard
                        </Link>
                        <Link
                            className="hover:text-foreground"
                            href="/watchlists"
                        >
                            Watchlists
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                    <span>{user.email}</span>
                    <SignOutButton />
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
