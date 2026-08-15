import { NumberTicker } from "@/frontend/components/aceternity/number-ticker";

const strip = [
    { k: "LATIDO", v: "CADA 2 H" },
    { k: "FUENTES", v: "9 OFICIALES" },
    { k: "DATOS", v: "100 % CROMA" },
] as const;

export function LandingProblema() {
    return (
        <section className="border-y border-rule bg-secondary">
            <div className="mx-auto w-full max-w-6xl px-4 py-24 text-center sm:px-10 md:py-32">
                <p className="label-ops text-muted-foreground">
                    Caudal real · medido por el agente
                </p>
                <div className="mt-8">
                    <NumberTicker
                        value={111}
                        className="font-mono text-[6rem] leading-none font-semibold tracking-tight text-signal sm:text-[9rem] lg:text-[12rem]"
                    />
                </div>
                <h2 className="mx-auto mt-4 max-w-[26ch] text-2xl sm:text-3xl">
                    licitaciones nuevas en 3 días. Una sola entidad.
                </h2>
                <p className="mx-auto mt-6 max-w-[52ch] text-lg text-secondary-foreground">
                    Publicadas mientras leías esto. Nadie puede revisarlas todas
                    a mano — y las que no lees, las gana otro.
                </p>
                <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-6 border-t border-rule pt-8 sm:grid-cols-3">
                    {strip.map((d) => (
                        <div key={d.k} className="leading-tight">
                            <dt className="label-ops text-muted-foreground">
                                {d.k}
                            </dt>
                            <dd className="mt-2 font-mono text-base font-semibold tracking-[0.04em]">
                                {d.v}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
