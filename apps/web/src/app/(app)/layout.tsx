import type { PropsWithChildren } from "react";
import { requireAuth } from "@/server/auth/require-auth";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: PropsWithChildren) {
    const { user } = await requireAuth();
    return (
        <div className="min-h-svh">
            <header className="flex items-center justify-between border-b px-6 py-3">
                <span className="font-semibold">Hackaton Starter</span>
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                    <span>{user.email}</span>
                    <SignOutButton />
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
