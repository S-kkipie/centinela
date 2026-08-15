"use client";
// Aceternity "Hero Highlight" — only the Highlight text sweep is kept.
// The dot-pattern container was dropped: it fights the .bg-grid-ops substrate.
// Recolored to intel tokens (accent-signal-soft), reduced-motion safe.
import { motion, useReducedMotion } from "motion/react";
import type React from "react";

import { cn } from "@/frontend/lib/utils";

export const Highlight = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const reduceMotion = useReducedMotion();
    return (
        <motion.span
            initial={{
                backgroundSize: reduceMotion ? "100% 0.32em" : "0% 0.32em",
            }}
            animate={{ backgroundSize: "100% 0.32em" }}
            transition={{
                duration: 1,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.35,
            }}
            style={{
                backgroundRepeat: "no-repeat",
                backgroundPosition: "left 88%",
                // marker-style underline sweep: strong enough to survive on
                // near-white paper, still leaves the ink text untouched
                backgroundImage:
                    "linear-gradient(color-mix(in oklab, var(--color-accent-signal) 38%, transparent), color-mix(in oklab, var(--color-accent-signal) 38%, transparent))",
                display: "inline",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
            }}
            className={cn("relative px-1", className)}
        >
            {children}
        </motion.span>
    );
};
