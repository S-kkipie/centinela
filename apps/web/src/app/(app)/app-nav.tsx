"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/frontend/lib/utils";

const links = [
    { href: "/dashboard", label: "Panel" },
    { href: "/watchlists", label: "Vigiladas" },
] as const;

export function AppNav() {
    const pathname = usePathname();
    return (
        <nav className="flex items-center gap-1">
            {links.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                    <Link
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "label-ops rounded-sm px-2.5 py-1.5 transition-colors",
                            active
                                ? "bg-accent text-signal"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                        href={l.href}
                        key={l.href}
                    >
                        {l.label}
                    </Link>
                );
            })}
        </nav>
    );
}
