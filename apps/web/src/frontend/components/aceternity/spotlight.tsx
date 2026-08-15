"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/frontend/lib/utils";

type SpotlightProps = {
    className?: string;
    fill?: string;
};

/**
 * Aceternity "Spotlight", recolored to the intel tokens (verde esmeralda)
 * and driven by motion instead of a global keyframe so it can respect
 * prefers-reduced-motion without touching globals.css.
 */
export const Spotlight = ({ className, fill }: SpotlightProps) => {
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -64 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className={cn(
                "pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%]",
                className,
            )}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 3787 2842"
            fill="none"
            aria-hidden="true"
        >
            <g filter="url(#centinela-spotlight-blur)">
                <ellipse
                    cx="1924.71"
                    cy="273.501"
                    rx="1924.71"
                    ry="273.501"
                    transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
                    fill={fill || "var(--color-accent-signal)"}
                    fillOpacity="0.22"
                />
            </g>
            <defs>
                <filter
                    id="centinela-spotlight-blur"
                    x="0.860352"
                    y="0.838989"
                    width="3785.16"
                    height="2840.26"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />
                    <feGaussianBlur
                        stdDeviation="151"
                        result="effect1_foregroundBlur"
                    />
                </filter>
            </defs>
        </motion.svg>
    );
};
