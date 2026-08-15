import { TracingBeam } from "@/frontend/components/aceternity/tracing-beam";

const fuentes = [
    {
        n: "01",
        nombre: "SECOP",
        rol: "Procesos, pliegos y adjudicaciones — la fuente primaria del barrido.",
    },
    {
        n: "02",
        nombre: "RUES",
        rol: "Existencia y matrícula mercantil de cada proponente.",
    },
    {
        n: "03",
        nombre: "Supersociedades",
        rol: "Situación societaria del contratista.",
    },
    {
        n: "04",
        nombre: "Rama Judicial",
        rol: "Procesos judiciales consultados por NIT.",
    },
    {
        n: "05",
        nombre: "Procuraduría · Contraloría",
        rol: "Sanciones disciplinarias y responsabilidad fiscal.",
    },
] as const;

const pipeline = [
    {
        titulo: "Barrido",
        desc: "El latido despierta al agente y consulta el SECOP.",
        stack: "Durable Object · alarma 2 h",
    },
    {
        titulo: "Cola",
        desc: "Cada proceso nuevo se encola sin perder ninguno.",
        stack: "Cloudflare Queues",
    },
    {
        titulo: "Workflow",
        desc: "Los 9 endpoints se consultan con reintentos durables.",
        stack: "Cloudflare Workflows",
    },
    {
        titulo: "Scoring",
        desc: "Gemini pondera la evidencia y asigna el puntaje.",
        stack: "Gemini",
    },
    {
        titulo: "Hallazgo",
        desc: "OPORTUNIDAD o BANDERA_ROJA, con la cadena citada.",
        stack: "Dashboard en vivo",
    },
] as const;

export function LandingEvidenceChain() {
    return (
        <section className="border-t border-rule" id="fuentes">
            <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-10">
                <header className="max-w-[60ch]">
                    <h2 className="text-3xl sm:text-4xl">
                        La cadena de evidencia
                    </h2>
                    <p className="mt-3 text-secondary-foreground">
                        9 endpoints de la API Croma, encadenados. Ninguna fuente
                        inventada, ningún dato sin origen: todo veredicto cita
                        de dónde salió.
                    </p>
                </header>

                <div className="mt-12 md:pl-14">
                    <TracingBeam>
                        <div className="border-t border-rule">
                            {fuentes.map((f) => (
                                <div
                                    key={f.n}
                                    className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b border-border py-5 md:grid-cols-[3rem_14rem_minmax(0,1fr)_auto] md:gap-x-6"
                                >
                                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                        {f.n}
                                    </span>
                                    <span className="font-display text-sm font-bold tracking-[0.02em]">
                                        {f.nombre}
                                    </span>
                                    <span className="col-start-2 text-sm text-secondary-foreground md:col-start-3">
                                        {f.rol}
                                    </span>
                                    <span className="label-ops col-start-2 text-muted-foreground md:col-start-4 md:text-right">
                                        Vía Croma
                                    </span>
                                </div>
                            ))}
                            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 pt-5">
                                <span className="label-ops text-signal">
                                    9 endpoints · 100 % Croma
                                </span>
                                <p className="max-w-[52ch] text-sm text-secondary-foreground">
                                    La cadena corre completa en cada ciclo. Si
                                    una fuente no responde, el veredicto lo dice
                                    — no lo rellena.
                                </p>
                            </div>
                        </div>
                    </TracingBeam>
                </div>

                <header className="mt-24 max-w-[60ch]">
                    <h2 className="text-3xl sm:text-4xl">
                        Infraestructura, no un experimento
                    </h2>
                    <p className="mt-3 text-secondary-foreground">
                        Un agente vivo con estado durable, colas y workflows:
                        ningún proceso se pierde, ninguna fuente se salta, y
                        cada veredicto sobrevive a reinicios y fallas. Diseñado
                        para operar años, no demos.
                    </p>
                </header>
                <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    {pipeline.map((paso, i) => (
                        <li
                            key={paso.titulo}
                            className="border-t-2 border-foreground pt-3"
                        >
                            <span className="label-ops text-muted-foreground">
                                0{i + 1}
                            </span>
                            <h3 className="mt-1 text-base">{paso.titulo}</h3>
                            <p className="mt-1 text-sm text-secondary-foreground">
                                {paso.desc}
                            </p>
                            <span className="mt-2 block font-mono text-xs tracking-[0.03em] text-muted-foreground">
                                {paso.stack}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
