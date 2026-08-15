"use client";
// Paper Shaders (MIT) — protagonist fields for hero + cierre.
// WebGL can't read CSS vars: hex values are the sRGB equivalents of the
// intel DARK tokens (landing renders inside `.dark`, see design.md):
//   #121715 → --color-paper (dark)              oklch(16% 0.012 170)
//   #171d1a → --color-paper-2 (dark)            oklch(19% 0.012 170)
//   #1a201d → --color-panel (dark)              oklch(20% 0.012 170)
//   #1d3a2f → --color-accent-signal-soft (dark) oklch(30% 0.045 165)
//   #35c08b → --color-accent-signal (dark)      oklch(72% 0.135 165)
// Lazy client-only mount + static token-gradient fallback while loading
// and under prefers-reduced-motion.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MeshGradient = dynamic(
    () =>
        import("@paper-design/shaders-react").then((m) => ({
            default: m.MeshGradient,
        })),
    { ssr: false },
);

const GodRays = dynamic(
    () =>
        import("@paper-design/shaders-react").then((m) => ({
            default: m.GodRays,
        })),
    { ssr: false },
);

function useShaderGate() {
    const [mounted, setMounted] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduceMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
        mq.addEventListener("change", onChange);
        setMounted(true);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return mounted && !reduceMotion;
}

/** Cierre: mesh-gradient field, dark emerald, clearly visible. */
export function ShaderBackdrop() {
    const live = useShaderGate();
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_20%_0%,var(--color-accent-signal-soft),transparent_60%),radial-gradient(70%_100%_at_90%_100%,var(--color-paper-2),transparent_55%)] opacity-70" />
            {live ? (
                <MeshGradient
                    colors={["#121715", "#1d3a2f", "#35c08b", "#171d1a"]}
                    distortion={0.9}
                    swirl={0.3}
                    speed={0.25}
                    className="absolute inset-0 opacity-70"
                    width="100%"
                    height="100%"
                />
            ) : null}
        </div>
    );
}

/** Hero: god-rays sweeping down from the top — the surveillance light. */
export function HeroShader() {
    const live = useShaderGate();
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_70%_-10%,var(--color-accent-signal-soft),transparent_60%)] opacity-60" />
            {live ? (
                <GodRays
                    colorBack="#12171500"
                    colorBloom="#35c08b"
                    colors={["#1d3a2f", "#35c08b", "#171d1a"]}
                    offsetY={-0.9}
                    density={0.35}
                    spotty={0.28}
                    midSize={0.1}
                    midIntensity={0.35}
                    intensity={0.5}
                    bloom={0.35}
                    speed={0.6}
                    className="absolute inset-0 opacity-45"
                    width="100%"
                    height="100%"
                />
            ) : null}
        </div>
    );
}
