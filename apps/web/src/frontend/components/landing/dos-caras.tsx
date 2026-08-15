import { CardSpotlight } from "@/frontend/components/aceternity/card-spotlight";

const cadenaOp = [
    { fuente: "RUES", estado: "matrícula mercantil verificada" },
    { fuente: "SUPERSOCIEDADES", estado: "situación societaria consultada" },
    { fuente: "RAMA JUDICIAL", estado: "historial consultado por NIT" },
    { fuente: "SANCIONES", estado: "Procuraduría y Contraloría cruzadas" },
] as const;

const cadenaFlag = [
    { fuente: "RAMA JUDICIAL", estado: "procesos vinculados al NIT" },
    { fuente: "GRAFO", estado: "el NIT queda como nodo con su historial" },
] as const;

export function LandingDosCaras() {
    return (
        <section className="border-t border-rule" id="motor">
            <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-10">
                <header className="max-w-[60ch]">
                    <h2 className="text-3xl sm:text-4xl">
                        Un solo motor. Dos caras.
                    </h2>
                    <p className="mt-3 text-secondary-foreground">
                        Cada proceso recibe un puntaje y un veredicto. La misma
                        cadena de evidencia que le muestra a una PYME honesta
                        qué licitación puede ganar es la que expone una
                        adjudicación amañada.
                    </p>
                </header>

                <div className="mt-12 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                    <CardSpotlight className="p-6">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between gap-4">
                                <span className="label-ops inline-flex rounded-sm border border-signal/40 bg-signal-soft px-2 py-1 text-signal">
                                    Oportunidad · 85
                                </span>
                                <span className="font-mono text-3xl leading-none font-semibold text-signal tabular-nums">
                                    85
                                </span>
                            </div>
                            <h3 className="mt-5 text-xl">
                                Contrato de servicios de bajo riesgo
                            </h3>
                            <p className="mt-2 max-w-[48ch] text-sm text-secondary-foreground">
                                Proceso ganable para una PYME: cuantía
                                alcanzable, requisitos proporcionados y un
                                contratante sin señales de captura.
                            </p>
                            <ul className="mt-5 border-t border-border font-mono text-xs">
                                {cadenaOp.map((c) => (
                                    <li
                                        key={c.fuente}
                                        className="grid grid-cols-1 gap-x-3 border-b border-border py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
                                    >
                                        <span className="font-semibold tracking-[0.05em]">
                                            {c.fuente}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {c.estado}
                                        </span>
                                    </li>
                                ))}
                                <li className="grid grid-cols-1 gap-x-3 border-b border-border py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
                                    <span className="font-semibold tracking-[0.05em]">
                                        VEREDICTO
                                    </span>
                                    <span className="font-semibold text-signal">
                                        presentarse — riesgo bajo
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </CardSpotlight>

                    <CardSpotlight
                        className="p-6 md:mt-10"
                        color="color-mix(in oklab, var(--color-flag) 8%, transparent)"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between gap-4">
                                <span className="label-ops inline-flex rounded-sm border border-flag/40 bg-flag-soft px-2 py-1 text-flag">
                                    Bandera_roja · 65
                                </span>
                                <span className="font-mono text-3xl leading-none font-semibold text-flag tabular-nums">
                                    65
                                </span>
                            </div>
                            <h3 className="mt-5 text-xl">
                                Historial judicial acumulado del contratista
                            </h3>
                            <p className="mt-2 max-w-[48ch] text-sm text-secondary-foreground">
                                El adjudicatario arrastra procesos en la Rama
                                Judicial que el pliego nunca miró. Centinela los
                                cita, expediente por expediente.
                            </p>
                            <ul className="mt-5 border-t border-border font-mono text-xs">
                                {cadenaFlag.map((c) => (
                                    <li
                                        key={c.fuente}
                                        className="grid grid-cols-1 gap-x-3 border-b border-border py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
                                    >
                                        <span className="font-semibold tracking-[0.05em]">
                                            {c.fuente}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {c.estado}
                                        </span>
                                    </li>
                                ))}
                                <li className="grid grid-cols-1 gap-x-3 border-b border-border py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
                                    <span className="font-semibold tracking-[0.05em]">
                                        VEREDICTO
                                    </span>
                                    <span className="font-semibold text-flag">
                                        revisar — evidencia citada
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </CardSpotlight>
                </div>

                <div className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-md border border-rule bg-card px-4 py-3">
                    <span className="label-ops text-muted-foreground">
                        Grafo de contratistas
                    </span>
                    <p className="max-w-[58ch] text-sm text-secondary-foreground">
                        Cada NIT es un nodo. Los hallazgos se conectan entre
                        entidades: un contratista señalado en una alcaldía no
                        vuelve a pasar desapercibido en otra.
                    </p>
                </div>
            </div>
        </section>
    );
}
