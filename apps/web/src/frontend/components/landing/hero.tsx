import Link from "next/link";
import { Spotlight } from "@/frontend/components/aceternity/spotlight";
import { TextGenerateEffect } from "@/frontend/components/aceternity/text-generate-effect";

const ciclo = [
    { n: "01", etapa: "BARRIDO", det: "SECOP · procesos nuevos" },
    { n: "02", etapa: "COLA", det: "encolados para análisis" },
    { n: "03", etapa: "WORKFLOW", det: "9 endpoints Croma" },
    { n: "04", etapa: "SCORING", det: "Gemini pondera evidencia" },
] as const;

export function LandingHero() {
    return (
        <section className="relative overflow-hidden">
            <Spotlight className="-top-40 left-0 md:-top-24 md:left-40" />
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-16 pb-24 sm:px-10 md:pt-24 lg:grid-cols-[7fr_5fr]">
                <div className="relative z-10">
                    <p className="label-ops mb-6 text-signal">
                        Agente autónomo · latido cada 2 h · SECOP vía API Croma
                    </p>
                    <h1 className="max-w-[18ch] text-4xl sm:text-5xl lg:text-6xl">
                        <TextGenerateEffect
                            words="Nadie vigila el SECOP a las 3 a.m. Centinela sí."
                            duration={0.4}
                        />
                    </h1>
                    <p className="mt-6 max-w-[54ch] text-lg text-secondary-foreground">
                        Un agente vivo, con latido cada 2 horas: barre las
                        licitaciones nuevas del SECOP vía la API Croma, cruza
                        cada proceso contra 9 fuentes estatales y emite un
                        veredicto con la evidencia citada.
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

                <figure
                    className="relative z-10 rounded-md border border-rule bg-card shadow-sm"
                    aria-label="Registro esquemático de un ciclo del agente"
                >
                    <figcaption className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 leading-none">
                        <span className="label-ops text-muted-foreground">
                            Centinela / ciclo
                        </span>
                        <span className="label-ops text-signal">Cada 2 h</span>
                    </figcaption>
                    <div className="p-4">
                        <ul className="font-mono text-xs leading-[1.9]">
                            {ciclo.map((row) => (
                                <li
                                    key={row.n}
                                    className="grid grid-cols-[2rem_6.5rem_minmax(0,1fr)] items-baseline gap-3 whitespace-nowrap"
                                >
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
                            ))}
                        </ul>
                        <hr className="my-2 border-t border-dashed border-rule" />
                        <ul className="font-mono text-xs leading-[1.9]">
                            <li className="grid grid-cols-[2rem_6.5rem_minmax(0,1fr)] items-baseline gap-3 whitespace-nowrap">
                                <span className="text-muted-foreground tabular-nums">
                                    05
                                </span>
                                <span className="font-semibold tracking-[0.06em] text-flag">
                                    BANDERA_ROJA
                                </span>
                                <span className="truncate text-muted-foreground">
                                    puntaje 65 · evidencia citada
                                </span>
                            </li>
                            <li className="grid grid-cols-[2rem_6.5rem_minmax(0,1fr)] items-baseline gap-3 whitespace-nowrap">
                                <span className="text-muted-foreground tabular-nums">
                                    05
                                </span>
                                <span className="font-semibold tracking-[0.06em] text-signal">
                                    OPORTUNIDAD
                                </span>
                                <span className="truncate text-muted-foreground">
                                    puntaje 85 · ganable
                                </span>
                            </li>
                        </ul>
                    </div>
                </figure>
            </div>
        </section>
    );
}
