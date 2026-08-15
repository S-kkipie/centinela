import Link from "next/link";
import { HoverBorderGradient } from "@/frontend/components/aceternity/hover-border-gradient";

export function LandingCierre() {
    return (
        <section className="border-t border-rule">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-8 px-4 py-20 sm:px-10">
                <div className="max-w-[44ch]">
                    <h2 className="max-w-[20ch] text-2xl sm:text-3xl">
                        El agente está corriendo ahora mismo.
                    </h2>
                    <p className="mt-3 text-secondary-foreground">
                        Hoy vigila Bogotá. La meta: cada entidad del Estado, y
                        después cada país donde exista contratación pública.
                    </p>
                </div>
                <Link href="/dashboard" className="rounded-md">
                    <HoverBorderGradient
                        as="div"
                        className="font-mono text-sm leading-none font-semibold tracking-[0.06em] whitespace-nowrap uppercase"
                    >
                        Ver el agente en vivo
                    </HoverBorderGradient>
                </Link>
            </div>
        </section>
    );
}
