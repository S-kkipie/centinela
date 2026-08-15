const datos = [
    { k: "LATIDO", v: "CADA 2 H" },
    { k: "FUENTES", v: "9 ENDPOINTS ESTATALES" },
    { k: "DATOS", v: "100 % API CROMA" },
] as const;

export function LandingFirehose() {
    return (
        <section className="border-t border-rule bg-secondary">
            <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-10">
                <p className="label-ops text-muted-foreground">
                    Caudal real · medido por el agente
                </p>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-4">
                    <span className="font-mono text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl">
                        111
                    </span>
                    <h2 className="max-w-[22ch] text-2xl sm:text-3xl">
                        licitaciones nuevas en 3 días. Una sola entidad.
                    </h2>
                </div>
                <p className="mt-6 max-w-[58ch] text-secondary-foreground">
                    Eso publicó la Alcaldía de Bogotá mientras usted leía otra
                    cosa. Nadie las revisa todas a mano — Centinela las barre en
                    cada latido y no deja pasar ninguna.
                </p>
                <dl className="mt-10 grid grid-cols-1 gap-4 border-t border-rule pt-6 sm:grid-cols-3">
                    {datos.map((d) => (
                        <div key={d.k} className="leading-tight">
                            <dt className="label-ops text-muted-foreground">
                                {d.k}
                            </dt>
                            <dd className="mt-1 font-mono text-sm font-semibold tracking-[0.04em]">
                                {d.v}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
