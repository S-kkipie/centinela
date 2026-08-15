import { FindingCard } from "@/frontend/components/landing/finding-card";

const cadena = [
    { fuente: "RUES", estado: "ok · matrícula mercantil vigente" },
    { fuente: "SUPERSOCIEDADES", estado: "ok · situación societaria normal" },
    { fuente: "RAMA JUDICIAL", estado: "ok · sin procesos por NIT" },
    { fuente: "SANCIONES", estado: "ok · Procuraduría y Contraloría limpias" },
] as const;

export function LandingOportunidad() {
    return (
        <section className="border-t border-rule" id="oportunidad">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-28 sm:px-10 lg:grid-cols-[5fr_7fr] lg:gap-20">
                <div>
                    <p className="label-ops text-signal">
                        Beneficio 01 · Oportunidad
                    </p>
                    <h2 className="mt-5 max-w-[18ch] text-3xl sm:text-4xl lg:text-5xl">
                        Encuentra contratos que sí puedes ganar.
                    </h2>
                    <p className="mt-6 max-w-[46ch] text-lg text-secondary-foreground">
                        El agente descarta el ruido y te deja solo procesos a tu
                        alcance: cuantía, requisitos y riesgo del contratante,
                        ya analizados.
                    </p>
                    <p className="mt-8 font-mono text-xs tracking-[0.04em] text-muted-foreground">
                        Hallazgo real del agente →
                    </p>
                </div>
                <FindingCard
                    kind="OPORTUNIDAD"
                    score={85}
                    titulo="Contrato de servicios de bajo riesgo"
                    resumen="Proceso ganable para una PYME: cuantía alcanzable, requisitos proporcionados y un contratante sin señales de riesgo."
                    cadena={cadena}
                    veredicto="presentarse — riesgo bajo"
                    tone="signal"
                />
            </div>
        </section>
    );
}
