"use client";
// Paper Shaders (MIT) — ambient fields for the ops console (dashboard +
// watchlists). WebGL can't read CSS vars: hex values are the sRGB
// equivalents of the intel DARK tokens (the console renders inside `.dark`,
// see design.md):
//   #121715 → --color-paper (dark)              oklch(16% 0.012 170)
//   #171d1a → --color-paper-2 (dark)            oklch(19% 0.012 170)
//   #1d3a2f → --color-accent-signal-soft (dark) oklch(30% 0.045 165)
//   #254c3b → soft-2 (between soft and signal)
//   #35c08b → --color-accent-signal (dark)      oklch(72% 0.135 165)
// Lazy client-only mount, nothing renders under prefers-reduced-motion.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const GrainGradient = dynamic(
    () =>
        import("@paper-design/shaders-react").then((m) => ({
            default: m.GrainGradient,
        })),
    { ssr: false },
);

const PulsingBorder = dynamic(
    () =>
        import("@paper-design/shaders-react").then((m) => ({
            default: m.PulsingBorder,
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

/** Cabecera de la consola: la misma ola de grano que aprobó la landing,
 * más tenue — ambiente, no protagonista. */
export function ConsolaShader() {
    const live = useShaderGate();
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {live ? (
                <GrainGradient
                    colorBack="#00000000"
                    colors={["#171d1a", "#1d3a2f", "#254c3b"]}
                    shape="wave"
                    softness={0.85}
                    intensity={0.3}
                    noise={0.2}
                    speed={0.3}
                    className="absolute inset-0 opacity-50"
                    width="100%"
                    height="100%"
                />
            ) : null}
        </div>
    );
}

/** Borde vivo para el panel que está recibiendo datos del agente. */
export function PanelVivoBorder() {
    const live = useShaderGate();
    if (!live) return null;
    return (
        <div
            className="pointer-events-none absolute -inset-[3px]"
            aria-hidden="true"
        >
            <PulsingBorder
                colorBack="#00000000"
                colors={["#35c08b", "#1d3a2f"]}
                roundness={0.08}
                thickness={0.015}
                softness={0.6}
                intensity={0.4}
                bloom={0.4}
                spots={3}
                spotSize={0.3}
                pulse={0.35}
                speed={0.55}
                className="h-full w-full"
                width="100%"
                height="100%"
            />
        </div>
    );
}
