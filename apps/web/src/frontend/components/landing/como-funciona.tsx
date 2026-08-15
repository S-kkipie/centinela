import { Timeline } from "@/frontend/components/aceternity/timeline";
import { RedFuentes } from "@/frontend/components/landing/red-fuentes";

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

export function LandingComoFunciona() {
    return (
        <section className="border-t border-rule" id="como-funciona">
            <div className="mx-auto w-full max-w-6xl px-4 py-28 sm:px-10">
                <div className="grid gap-14 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-24">
                    <header className="lg:sticky lg:top-28 lg:self-start">
                        <p className="label-ops text-muted-foreground">
                            Cómo funciona
                        </p>
                        <h2 className="mt-5 max-w-[16ch] text-3xl sm:text-4xl lg:text-5xl">
                            De la publicación al veredicto en un solo ciclo.
                        </h2>
                        <p className="mt-6 max-w-[40ch] text-lg text-secondary-foreground">
                            Estado durable, colas y workflows: ningún proceso se
                            pierde, ninguna fuente se salta. Diseñado para
                            operar años, no demos.
                        </p>
                    </header>

                    <Timeline
                        data={pasos.map((paso, i) => ({
                            title: (
                                <div
                                    key={`${paso.titulo}-title`}
                                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
                                >
                                    <span className="label-ops text-muted-foreground">
                                        0{i + 1}
                                    </span>
                                    <h3 className="text-xl sm:text-2xl">
                                        {paso.titulo}
                                    </h3>
                                </div>
                            ),
                            content: (
                                <div
                                    key={`${paso.titulo}-content`}
                                    className="mt-2"
                                >
                                    <p className="max-w-[52ch] text-base text-secondary-foreground">
                                        {paso.desc}
                                    </p>
                                    <span className="mt-2 block font-mono text-xs tracking-[0.03em] text-muted-foreground">
                                        {paso.stack}
                                    </span>
                                </div>
                            ),
                        }))}
                    />
                </div>

                <div className="mt-24 border-t border-rule pt-10">
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                        <span className="label-ops text-signal">
                            Las fuentes · vía Croma
                        </span>
                        <p className="max-w-[52ch] text-sm text-secondary-foreground">
                            Ninguna fuente inventada: todo veredicto cita de
                            dónde salió.
                        </p>
                    </div>
                    <RedFuentes />
                </div>
            </div>
        </section>
    );
}
