import { FindingCard } from "@/frontend/components/landing/finding-card";

const cadena = [
    { fuente: "RAMA JUDICIAL", estado: "procesos vinculados al NIT" },
    { fuente: "EXPEDIENTES", estado: "citados uno por uno en el hallazgo" },
    { fuente: "GRAFO", estado: "el NIT queda como nodo con su historial" },
] as const;

export function LandingBanderaRoja() {
    return (
        <section className="border-t border-rule bg-secondary" id="bandera">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-10 lg:grid-cols-[6fr_6fr]">
                <div className="lg:order-2">
                    <p className="label-ops text-flag">
                        Beneficio 02 · Bandera roja
                    </p>
                    <h2 className="mt-4 max-w-[20ch] text-3xl sm:text-4xl">
                        Lo que el pliego no te cuenta.
                    </h2>
                    <p className="mt-4 max-w-[50ch] text-lg text-secondary-foreground">
                        Historial judicial, sanciones y vínculos del
                        adjudicatario — citados expediente por expediente, antes
                        de que sean escándalo.
                    </p>
                    <p className="mt-6 font-mono text-xs tracking-[0.04em] text-muted-foreground">
                        Hallazgo real del agente →
                    </p>
                </div>
                <div className="lg:order-1">
                    <FindingCard
                        kind="BANDERA_ROJA"
                        score={65}
                        titulo="Historial judicial acumulado del contratista"
                        resumen="El adjudicatario arrastra procesos en la Rama Judicial que el pliego nunca miró. Centinela los cita, expediente por expediente."
                        cadena={cadena}
                        veredicto="revisar — evidencia citada"
                        tone="flag"
                    />
                </div>
            </div>
        </section>
    );
}
