export function LandingFooter() {
    return (
        <footer className="border-t border-foreground bg-secondary">
            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-10">
                <p className="max-w-[74ch] font-mono text-xs leading-[1.9] text-muted-foreground">
                    CENTINELA — agente autónomo de vigilancia de la contratación
                    pública colombiana. Construido para la IA-Hackathon GOV-TECH
                    by Croma. Datos: SECOP y fuentes estatales vía la API Croma
                    (9 endpoints, 100 %). Motor de análisis: Gemini.
                    Infraestructura: Cloudflare Durable Objects, Queues y
                    Workflows. Latido: cada 2 horas. Tipografía: Space Grotesk,
                    Inter Tight, IBM Plex Mono. Bogotá, Colombia — 2026.
                </p>
            </div>
        </footer>
    );
}
