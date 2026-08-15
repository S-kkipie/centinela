"use client";
// Paper Shaders (MIT) — quiet mesh-gradient field for the cierre.
// WebGL can't read CSS vars: hex values below are the exact sRGB
// equivalents of the intel tokens (see design.md):
//   #f1f6f4 → --color-paper          oklch(97% 0.006 170)
//   #e8efec → --color-paper-2        oklch(94.5% 0.008 170)
//   #f8fcfa → --color-panel          oklch(98.8% 0.005 170)
//   #d6efe3 → --color-accent-signal-soft oklch(93% 0.03 165)
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

const TOKEN_COLORS = [
    "#f1f6f4", // --color-paper
    "#e8efec", // --color-paper-2
    "#d6efe3", // --color-accent-signal-soft
    "#f8fcfa", // --color-panel
];

export function ShaderBackdrop() {
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

    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* static fallback: same tokens, no motion — always underneath */}
            <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_20%_0%,var(--color-accent-signal-soft),transparent_60%),radial-gradient(70%_100%_at_90%_100%,var(--color-paper-2),transparent_55%)] opacity-70" />
            {mounted && !reduceMotion ? (
                <MeshGradient
                    colors={TOKEN_COLORS}
                    distortion={0.5}
                    swirl={0.15}
                    speed={0.12}
                    className="absolute inset-0 opacity-80"
                    width="100%"
                    height="100%"
                />
            ) : null}
        </div>
    );
}
