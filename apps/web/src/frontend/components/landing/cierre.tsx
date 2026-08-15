import Link from "next/link";

import { HoverBorderGradient } from "@/frontend/components/aceternity/hover-border-gradient";
import { ShaderBackdrop } from "@/frontend/components/landing/shader-backdrop";

export function LandingCierre() {
    return (
        <section className="relative border-t border-rule">
            <ShaderBackdrop />
            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-32 text-center sm:px-10 md:py-44">
                <h2 className="max-w-[20ch] text-4xl sm:text-5xl lg:text-6xl">
                    Empieza con una entidad. El agente hace el resto.
                </h2>
                <p className="max-w-[44ch] text-lg text-secondary-foreground sm:text-xl">
                    Hoy vigila Bogotá. La meta: cada peso público bajo
                    vigilancia.
                </p>
                <Link href="/dashboard" className="mt-2 rounded-md">
                    <HoverBorderGradient
                        as="div"
                        className="px-8 py-4 font-mono text-sm leading-none font-semibold tracking-[0.06em] whitespace-nowrap uppercase"
                    >
                        Ver el agente en vivo
                    </HoverBorderGradient>
                </Link>
            </div>
        </section>
    );
}
