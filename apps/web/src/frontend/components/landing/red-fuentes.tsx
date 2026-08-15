"use client";
// Diagrama de la red real de evidencia: 5 fuentes estatales → Centinela →
// veredicto. Beams (Magic UI AnimatedBeam) en tokens intel; en móvil el
// diagrama cede a la lista simple (los beams necesitan ancho).
import { useRef } from "react";

import { AnimatedBeam } from "@/frontend/components/aceternity/animated-beam";
import { NodoVivoBorder } from "@/frontend/components/landing/shader-backdrop";
import { cn } from "@/frontend/lib/utils";

const fuentes = [
    { nombre: "SECOP", rol: "procesos, pliegos y adjudicaciones" },
    { nombre: "RUES", rol: "existencia y matrícula mercantil" },
    { nombre: "Supersociedades", rol: "situación societaria" },
    { nombre: "Rama Judicial", rol: "procesos judiciales por NIT" },
    {
        nombre: "Procuraduría · Contraloría",
        rol: "sanciones y responsabilidad fiscal",
    },
] as const;

function Nodo({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                // relative is required: z-10 is ignored on static elements and
                // the beam SVG would otherwise paint across the card
                "relative z-10 rounded-md border border-rule bg-card px-4 py-3 leading-snug",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function RedFuentes() {
    const containerRef = useRef<HTMLDivElement>(null);
    const fuenteRefs = [
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
    ];
    const centroRef = useRef<HTMLDivElement>(null);
    const opRef = useRef<HTMLDivElement>(null);
    const flagRef = useRef<HTMLDivElement>(null);

    return (
        <>
            {/* móvil: lista simple */}
            <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
                {fuentes.map((f) => (
                    <div
                        key={f.nombre}
                        className="rounded-md border border-rule bg-card px-4 py-4 leading-snug"
                    >
                        <dt className="font-display text-sm font-bold tracking-[0.02em]">
                            {f.nombre}
                        </dt>
                        <dd className="mt-1 text-sm text-secondary-foreground">
                            {f.rol}
                        </dd>
                        <dd className="label-ops mt-3 text-muted-foreground">
                            Vía Croma
                        </dd>
                    </div>
                ))}
            </dl>

            {/* desktop: red con beams */}
            <div
                ref={containerRef}
                className="relative mt-10 hidden items-center justify-between gap-10 md:flex lg:gap-16"
            >
                <div className="flex flex-col gap-4">
                    {fuentes.map((f, i) => (
                        <div key={f.nombre} ref={fuenteRefs[i]}>
                            <Nodo>
                                <span className="font-display text-sm font-bold tracking-[0.02em]">
                                    {f.nombre}
                                </span>
                                <span className="mt-1 block max-w-[24ch] text-xs text-secondary-foreground">
                                    {f.rol}
                                </span>
                            </Nodo>
                        </div>
                    ))}
                </div>

                <div ref={centroRef} className="relative">
                    <NodoVivoBorder />
                    <Nodo className="border-signal/50 px-6 py-5 text-center shadow-[0_0_40px_-12px_var(--color-accent-signal)]">
                        <span className="font-display text-lg font-bold tracking-[0.04em]">
                            CENTINELA
                            <span className="text-signal">_</span>
                        </span>
                        <span className="label-ops mt-1 block text-muted-foreground">
                            cruza · pondera · cita
                        </span>
                    </Nodo>
                </div>

                <div className="flex flex-col gap-6">
                    <div ref={opRef}>
                        <Nodo className="border-signal/40">
                            <span className="label-ops text-signal">
                                OPORTUNIDAD · 85
                            </span>
                            <span className="mt-1 block text-xs text-secondary-foreground">
                                ganable — presentarse
                            </span>
                        </Nodo>
                    </div>
                    <div ref={flagRef}>
                        <Nodo className="border-flag/40">
                            <span className="label-ops text-flag">
                                BANDERA_ROJA · 65
                            </span>
                            <span className="mt-1 block text-xs text-secondary-foreground">
                                revisar — evidencia citada
                            </span>
                        </Nodo>
                    </div>
                </div>

                {fuenteRefs.map((ref, i) => (
                    <AnimatedBeam
                        key={fuentes[i].nombre}
                        containerRef={containerRef}
                        fromRef={ref}
                        toRef={centroRef}
                        curvature={(i - 2) * 28}
                        duration={4.5}
                        delay={i * 0.6}
                        className="motion-reduce:hidden"
                    />
                ))}
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={centroRef}
                    toRef={opRef}
                    curvature={-24}
                    duration={4.5}
                    delay={1.2}
                    className="motion-reduce:hidden"
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={centroRef}
                    toRef={flagRef}
                    curvature={24}
                    duration={4.5}
                    delay={2.4}
                    gradientStartColor="var(--color-flag)"
                    gradientStopColor="var(--color-flag)"
                    className="motion-reduce:hidden"
                />
            </div>
        </>
    );
}
