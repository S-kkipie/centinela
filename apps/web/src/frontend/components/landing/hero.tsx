"use client";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Highlight } from "@/frontend/components/aceternity/hero-highlight";
import { Spotlight } from "@/frontend/components/aceternity/spotlight";
import { cn } from "@/frontend/lib/utils";

const ciclo = [
    { n: "01", etapa: "BARRIDO", det: "SECOP · procesos nuevos" },
    { n: "02", etapa: "COLA", det: "encolados sin perder ninguno" },
    { n: "03", etapa: "WORKFLOW", det: "9 endpoints oficiales" },
    { n: "04", etapa: "SCORING", det: "Gemini pondera evidencia" },
    { n: "05", etapa: "HALLAZGO", det: "veredicto en tu panel" },
] as const;

function CicloPanel() {
    const reduceMotion = useReducedMotion();
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (reduceMotion) return;
        const id = setInterval(
            () => setActive((prev) => (prev + 1) % ciclo.length),
            1700,
        );
        return () => clearInterval(id);
    }, [reduceMotion]);

    return (
        <figure
            className="relative z-10 rounded-md border border-rule bg-card shadow-sm"
            aria-label="Registro esquemático de un ciclo del agente"
        >
            <figcaption className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 leading-none">
                <span className="label-ops text-muted-foreground">
                    centinela / ciclo
                </span>
                <span className="label-ops inline-flex items-center gap-2 text-signal">
                    <span className="relative flex h-[6px] w-[6px]">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:hidden" />
                        <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-signal" />
                    </span>
                    Cada 2 h
                </span>
            </figcaption>
            <div className="p-4">
                <ul className="font-mono text-xs leading-[2]">
                    {ciclo.map((row, i) => {
                        const isActive = !reduceMotion && i === active;
                        return (
                            <li
                                key={row.n}
                                className={cn(
                                    "grid grid-cols-[1rem_2rem_6.5rem_minmax(0,1fr)] items-baseline gap-2 whitespace-nowrap rounded-sm px-1 transition-colors duration-[220ms]",
                                    isActive && "bg-accent",
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "text-signal transition-opacity duration-[220ms]",
                                        isActive ? "opacity-100" : "opacity-0",
                                    )}
                                >
                                    ▸
                                </span>
                                <span className="text-muted-foreground tabular-nums">
                                    {row.n}
                                </span>
                                <span className="font-semibold tracking-[0.06em]">
                                    {row.etapa}
                                </span>
                                <span className="truncate text-muted-foreground">
                                    {row.det}
                                </span>
                            </li>
                        );
                    })}
                </ul>
                <hr className="my-2 border-t border-dashed border-rule" />
                <ul className="font-mono text-xs leading-[2]">
                    <li className="grid grid-cols-[1rem_2rem_minmax(0,1fr)] items-baseline gap-2 whitespace-nowrap px-1">
                        <span aria-hidden="true" className="text-signal">
                            →
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                            out
                        </span>
                        <span className="truncate">
                            <span className="font-semibold tracking-[0.06em] text-signal">
                                OPORTUNIDAD · 85
                            </span>
                            <span className="text-muted-foreground">
                                {" "}
                                — ganable
                            </span>
                        </span>
                    </li>
                    <li className="grid grid-cols-[1rem_2rem_minmax(0,1fr)] items-baseline gap-2 whitespace-nowrap px-1">
                        <span aria-hidden="true" className="text-flag">
                            →
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                            out
                        </span>
                        <span className="truncate">
                            <span className="font-semibold tracking-[0.06em] text-flag">
                                BANDERA_ROJA · 65
                            </span>
                            <span className="text-muted-foreground">
                                {" "}
                                — evidencia citada
                            </span>
                        </span>
                    </li>
                </ul>
            </div>
        </figure>
    );
}

export function LandingHero() {
    return (
        <section className="relative overflow-hidden">
            <Spotlight className="-top-40 left-0 md:-top-24 md:left-40" />
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-16 pb-24 sm:px-10 md:pt-24 lg:grid-cols-[7fr_5fr]">
                <div className="relative z-10">
                    <p className="label-ops mb-6 text-signal">
                        Agente autónomo · Contratación pública
                    </p>
                    <h1 className="max-w-[16ch] text-4xl sm:text-5xl lg:text-6xl">
                        Tu próximo contrato con el Estado{" "}
                        <Highlight>ya está publicado.</Highlight>
                    </h1>
                    <p className="mt-6 max-w-[54ch] text-lg text-secondary-foreground">
                        Centinela vigila el SECOP día y noche, cruza cada
                        licitación nueva contra 9 fuentes oficiales y te dice
                        cuál puedes ganar — antes que tu competencia.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="rounded-md border border-foreground bg-foreground px-6 py-3 font-mono text-sm leading-none font-semibold tracking-[0.06em] whitespace-nowrap text-background uppercase transition-colors hover:border-secondary-foreground hover:bg-secondary-foreground"
                        >
                            Ver el agente en vivo
                        </Link>
                        <span className="font-mono text-xs tracking-[0.04em] text-muted-foreground">
                            Sin registro. El agente ya está corriendo.
                        </span>
                    </div>
                </div>
                <CicloPanel />
            </div>
        </section>
    );
}
