import Link from "next/link";

import { HoverBorderGradient } from "@/frontend/components/aceternity/hover-border-gradient";
import { ShaderBackdrop } from "@/frontend/components/landing/shader-backdrop";

export function LandingCierre() {
    return (
        <section className="relative border-t border-rule">
            <ShaderBackdrop />
            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-4 py-24 sm:px-10 md:py-32">
                <h2 className="max-w-[22ch] text-3xl sm:text-4xl">
                    Empieza con una entidad. El agente hace el resto.
                </h2>
                <p className="max-w-[48ch] text-lg text-secondary-foreground">
                    Hoy vigila Bogotá. La meta: cada peso público bajo
                    vigilancia.
                </p>
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
