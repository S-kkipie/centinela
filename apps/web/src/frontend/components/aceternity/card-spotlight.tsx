"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import type {
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    ReactNode,
} from "react";
import { cn } from "@/frontend/lib/utils";

/**
 * Aceternity "Card Spotlight", stripped of the three.js canvas reveal
 * (off-brand) and recolored to the intel tokens: a restrained radial wash
 * that follows the pointer inside a standard panel.
 */
export const CardSpotlight = ({
    children,
    radius = 320,
    color = "color-mix(in oklab, var(--color-accent-signal) 9%, transparent)",
    className,
    ...props
}: {
    radius?: number;
    color?: string;
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
        currentTarget,
        clientX,
        clientY,
    }: ReactMouseEvent<HTMLDivElement>) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const mask = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, white, transparent 80%)`;

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: mousemove only drives a decorative highlight; the card stays non-interactive
        <div
            className={cn(
                "group/spotlight relative overflow-hidden rounded-md border border-rule bg-card",
                className,
            )}
            onMouseMove={handleMouseMove}
            {...props}
        >
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px z-0 rounded-md opacity-0 transition duration-300 group-hover/spotlight:opacity-100 motion-reduce:hidden"
                style={{
                    backgroundColor: color,
                    maskImage: mask,
                    WebkitMaskImage: mask,
                }}
            />
            {children}
        </div>
    );
};
