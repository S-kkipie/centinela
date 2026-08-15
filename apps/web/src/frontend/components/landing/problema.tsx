import { EncryptedText } from "@/frontend/components/aceternity/encrypted-text";

const strip = [
    { k: "LATIDO", v: "CADA 2 H" },
    { k: "FUENTES", v: "9 OFICIALES" },
    { k: "DATOS", v: "100 % CROMA" },
] as const;

export function LandingProblema() {
    return (
        <section className="border-t border-rule bg-secondary">
            <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-10 md:py-24">
                <p className="label-ops text-muted-foreground">
                    Caudal real · medido por el agente
                </p>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-4">
                    <EncryptedText
                        text="111"
                        charset="0123456789"
                        revealDelayMs={260}
                        flipDelayMs={70}
                        className="font-mono text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl"
                        encryptedClassName="text-muted-foreground"
                    />
                    <h2 className="max-w-[22ch] text-2xl sm:text-3xl">
                        licitaciones nuevas en 3 días. Una sola entidad.
                    </h2>
                </div>
                <p className="mt-6 max-w-[58ch] text-lg text-secondary-foreground">
                    Publicadas mientras leías esto. Nadie puede revisarlas todas
                    a mano — y las que no lees, las gana otro.
                </p>
                <dl className="mt-10 grid grid-cols-1 gap-4 border-t border-rule pt-6 sm:grid-cols-3">
                    {strip.map((d) => (
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
