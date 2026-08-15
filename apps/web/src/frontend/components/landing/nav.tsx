import Link from "next/link";
import { BrandMark } from "@/frontend/components/brand/brand-mark";

export function LandingNav() {
    return (
        <header className="sticky top-0 z-50 border-b border-rule bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex min-h-[60px] w-full max-w-6xl items-center gap-6 px-4 py-3 sm:px-10">
                <Link
                    href="/"
                    className="flex items-center gap-2 whitespace-nowrap font-display text-xl leading-none font-bold tracking-[0.04em]"
                >
                    <BrandMark className="size-6 shrink-0 text-foreground" />
                    <span>
                        CENTINELA<span className="text-signal">_</span>
                    </span>
                </Link>
                <span className="label-ops hidden items-center gap-2 text-signal sm:inline-flex">
                    <span className="relative flex h-[7px] w-[7px]">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:hidden" />
                        <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-signal" />
                    </span>
                    En vivo
                </span>
                <Link
                    href="/dashboard"
                    className="ml-auto rounded-md border border-foreground bg-foreground px-4 py-2 font-mono text-xs leading-none font-semibold tracking-[0.06em] whitespace-nowrap text-background uppercase transition-colors hover:border-secondary-foreground hover:bg-secondary-foreground"
                >
                    Ver<span className="hidden sm:inline"> el agente</span> en
                    vivo
                </Link>
            </div>
        </header>
    );
}
