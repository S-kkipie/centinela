import { Timeline } from "@/frontend/components/aceternity/timeline";

const pasos = [
    {
        titulo: "Barrido SECOP",
        desc: "El latido despierta al agente y consulta los procesos nuevos.",
        stack: "Durable Object · alarma 2 h",
    },
    {
        titulo: "Cola",
        desc: "Cada proceso se encola sin perder ninguno.",
        stack: "Cloudflare Queues",
    },
    {
        titulo: "Workflow",
        desc: "Los 9 endpoints oficiales se consultan con reintentos durables.",
        stack: "Cloudflare Workflows",
    },
    {
        titulo: "Scoring",
        desc: "Gemini pondera la evidencia y asigna el puntaje.",
        stack: "Gemini",
    },
    {
        titulo: "Hallazgo en tu panel",
        desc: "OPORTUNIDAD o BANDERA_ROJA, con la cadena de evidencia citada.",
        stack: "Dashboard en vivo",
    },
] as const;

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

export function LandingComoFunciona() {
    return (
        <section className="border-t border-rule" id="como-funciona">
            <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-10">
                <header className="max-w-[60ch]">
                    <p className="label-ops text-muted-foreground">
                        Cómo funciona
                    </p>
                    <h2 className="mt-4 max-w-[24ch] text-3xl sm:text-4xl">
                        De la publicación al veredicto en un solo ciclo.
                    </h2>
                </header>

                <Timeline
                    className="mt-14 max-w-3xl"
                    data={pasos.map((paso, i) => ({
                        title: (
                            <div
                                key={`${paso.titulo}-title`}
                                className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
                            >
                                <span className="label-ops text-muted-foreground">
                                    0{i + 1}
                                </span>
                                <h3 className="text-lg sm:text-xl">
                                    {paso.titulo}
                                </h3>
                            </div>
                        ),
                        content: (
                            <div
                                key={`${paso.titulo}-content`}
                                className="mt-1"
                            >
                                <p className="max-w-[52ch] text-sm text-secondary-foreground">
                                    {paso.desc}
                                </p>
                                <span className="mt-1 block font-mono text-xs tracking-[0.03em] text-muted-foreground">
                                    {paso.stack}
                                </span>
                            </div>
                        ),
                    }))}
                />

                <div className="mt-16 border-t border-rule pt-8">
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                        <span className="label-ops text-signal">
                            Las fuentes · vía Croma
                        </span>
                        <p className="max-w-[52ch] text-sm text-secondary-foreground">
                            Ninguna fuente inventada: todo veredicto cita de
                            dónde salió.
                        </p>
                    </div>
                    <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {fuentes.map((f) => (
                            <div
                                key={f.nombre}
                                className="rounded-md border border-rule bg-card px-4 py-3 leading-tight"
                            >
                                <dt className="font-display text-sm font-bold tracking-[0.02em]">
                                    {f.nombre}
                                </dt>
                                <dd className="mt-1 text-xs text-secondary-foreground">
                                    {f.rol}
                                </dd>
                                <dd className="label-ops mt-2 text-muted-foreground">
                                    Vía Croma
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
