"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/frontend/lib/utils";

/**
 * Aceternity "Tracing Beam", recolored to the intel tokens: a single
 * verde-esmeralda beam over a hairline rule. The beam is hidden below md
 * (no horizontal overflow on small screens) and under reduced motion the
 * moving gradient path is hidden, leaving the static rule.
 */
export const TracingBeam = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [svgHeight, setSvgHeight] = useState(0);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    useEffect(() => {
        const node = contentRef.current;
        if (!node) return;
        const update = () => setSvgHeight(node.offsetHeight);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const y1 = useSpring(
        useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]),
        { stiffness: 500, damping: 90 },
    );
    const y2 = useSpring(
        useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]),
        { stiffness: 500, damping: 90 },
    );

    return (
        <motion.div
            ref={ref}
            className={cn("relative mx-auto h-full w-full", className)}
        >
            <div
                className="absolute top-3 -left-4 hidden md:-left-14 md:block"
                aria-hidden="true"
            >
                <div className="ml-[27px] flex h-4 w-4 items-center justify-center rounded-full border border-rule bg-panel">
                    <div className="h-2 w-2 rounded-full bg-signal" />
                </div>
                <svg
                    viewBox={`0 0 20 ${svgHeight}`}
                    width="20"
                    height={svgHeight}
                    className="ml-4 block"
                    aria-hidden="true"
                >
                    <motion.path
                        d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
                        fill="none"
                        stroke="var(--color-rule)"
                        strokeOpacity="0.7"
                    />
                    <motion.path
                        d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
                        fill="none"
                        stroke="url(#centinela-beam-gradient)"
                        strokeWidth="1.5"
                        className="motion-reduce:hidden"
                    />
                    <defs>
                        <motion.linearGradient
                            id="centinela-beam-gradient"
                            gradientUnits="userSpaceOnUse"
                            x1="0"
                            x2="0"
                            y1={y1}
                            y2={y2}
                        >
                            <stop
                                stopColor="var(--color-accent-signal)"
                                stopOpacity="0"
                            />
                            <stop stopColor="var(--color-accent-signal)" />
                            <stop
                                offset="0.325"
                                stopColor="var(--color-focus)"
                            />
                            <stop
                                offset="1"
                                stopColor="var(--color-accent-signal)"
                                stopOpacity="0"
                            />
                        </motion.linearGradient>
                    </defs>
                </svg>
            </div>
            <div ref={contentRef}>{children}</div>
        </motion.div>
    );
};
