import Link from "next/link";

const enlaces = [
    { href: "#oportunidad", label: "Oportunidades" },
    { href: "#bandera", label: "Banderas rojas" },
    { href: "#como-funciona", label: "Cómo funciona" },
    { href: "/dashboard", label: "Panel en vivo" },
] as const;

export function LandingFooter() {
    return (
        <footer className="border-t-2 border-foreground bg-secondary">
            <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-10">
                <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-6">
                    <span className="font-display text-2xl leading-none font-bold tracking-[0.04em]">
                        CENTINELA<span className="text-signal">_</span>
                    </span>
                    <nav className="flex flex-wrap gap-x-8 gap-y-3">
                        {enlaces.map((e) => (
                            <Link
                                key={e.href}
                                href={e.href}
                                className="label-ops whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {e.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <p className="mt-10 max-w-[80ch] border-t border-rule pt-8 font-mono text-xs leading-[1.9] text-muted-foreground">
                    CENTINELA — la capa de inteligencia sobre la contratación
                    pública. Vigilancia autónoma, veredictos con evidencia
                    citada, cero datos inventados. Fuentes: SECOP, RUES,
                    Supersociedades, Rama Judicial, Procuraduría y Contraloría,
                    vía la API Croma. El agente opera de forma continua, con
                    latido cada 2 horas. Bogotá, Colombia — 2026.
                </p>
            </div>
        </footer>
    );
}
