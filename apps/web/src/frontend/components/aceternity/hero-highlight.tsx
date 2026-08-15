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
            initial={{ backgroundSize: reduceMotion ? "100% 100%" : "0% 100%" }}
            animate={{ backgroundSize: "100% 100%" }}
            transition={{
                duration: 1,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.35,
            }}
            style={{
                backgroundRepeat: "no-repeat",
                backgroundPosition: "left center",
                backgroundImage:
                    "linear-gradient(var(--color-accent-signal-soft), var(--color-accent-signal-soft))",
                display: "inline",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
            }}
            className={cn("relative rounded-sm px-1", className)}
        >
            {children}
        </motion.span>
    );
};
