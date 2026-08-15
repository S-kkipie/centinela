import { LandingCierre } from "@/frontend/components/landing/cierre";
import { LandingDosCaras } from "@/frontend/components/landing/dos-caras";
import { LandingEvidenceChain } from "@/frontend/components/landing/evidence-chain";
import { LandingFirehose } from "@/frontend/components/landing/firehose";
import { LandingFooter } from "@/frontend/components/landing/footer";
import { LandingHero } from "@/frontend/components/landing/hero";
import { LandingNav } from "@/frontend/components/landing/nav";

export default function HomePage() {
    return (
        <div className="bg-grid-ops min-h-svh">
            <LandingNav />
            <main>
                <LandingHero />
                <LandingFirehose />
                <LandingDosCaras />
                <LandingEvidenceChain />
                <LandingCierre />
            </main>
            <LandingFooter />
        </div>
    );
}
