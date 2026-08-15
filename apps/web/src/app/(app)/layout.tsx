import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { CopilotUiProvider } from "@/core/copilot/client/store";
import { AppShell } from "@/core/copilot/client/ui/app-shell";
import { ChatPanel } from "@/core/copilot/client/ui/chat-panel";
import { requireAuth } from "@/server/auth/require-auth";
import { AppNav } from "./app-nav";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: PropsWithChildren) {
    const { user } = await requireAuth();
    return (
        // La consola es una sala de operaciones: siempre dark, como la landing.
        // El copiloto (CopilotKit v2 + store de comandos UI) se monta SOLO aquí,
        // en el árbol autenticado — nunca en la landing.
        <CopilotUiProvider>
            <CopilotKitProvider runtimeUrl="/api/copilotkit" useSingleEndpoint>
                <div className="dark min-h-svh bg-background text-foreground">
                    <AppShell>
                        <header className="sticky top-0 z-40 border-rule border-b bg-panel/85 backdrop-blur">
                            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
                                <div className="flex min-w-0 items-center gap-5">
                                    <Link
                                        className="font-display font-semibold text-foreground text-sm tracking-tight"
                                        href="/dashboard"
                                    >
                                        CENTINELA
                                        <span className="text-signal">_</span>
                                    </Link>
                                    <span
                                        aria-hidden
                                        className="hidden h-4 w-px bg-rule sm:block"
                                    />
                                    <AppNav />
                                </div>
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="label-ops flex items-center gap-1.5 whitespace-nowrap text-signal">
                                        <span
                                            aria-hidden
                                            className="relative flex size-1.5"
                                        >
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:hidden" />
                                            <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                                        </span>
                                        <span className="hidden sm:inline">
                                            En vivo
                                        </span>
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
                    </AppShell>
                    <ChatPanel />
                </div>
            </CopilotKitProvider>
        </CopilotUiProvider>
    );
}
