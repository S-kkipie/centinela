import { LandingBanderaRoja } from "@/frontend/components/landing/bandera-roja";
import { LandingCierre } from "@/frontend/components/landing/cierre";
import { LandingComoFunciona } from "@/frontend/components/landing/como-funciona";
import { LandingFooter } from "@/frontend/components/landing/footer";
import { LandingHero } from "@/frontend/components/landing/hero";
import { LandingNav } from "@/frontend/components/landing/nav";
import { LandingOportunidad } from "@/frontend/components/landing/oportunidad";
import { LandingProblema } from "@/frontend/components/landing/problema";

export default function HomePage() {
    return (
        <div className="dark bg-grid-ops min-h-svh bg-background text-foreground">
            <LandingNav />
            <main>
                <LandingHero />
                <LandingProblema />
                <LandingOportunidad />
                <LandingBanderaRoja />
                <LandingComoFunciona />
                <LandingCierre />
            </main>
            <LandingFooter />
        </div>
    );
}
