"use client";
// Aceternity "Timeline" — scroll-following beam over a vertical list.
// Adapted: intel tokens (rule line, signal beam), no hardcoded page chrome,
// compact node dots, reduced-motion renders the beam fully drawn.
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/frontend/lib/utils";

export interface TimelineEntry {
    title: React.ReactNode;
    content: React.ReactNode;
}

export const Timeline = ({
    data,
    className,
}: {
    data: TimelineEntry[];
    className?: string;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const measure = () => {
            if (ref.current) {
                setHeight(ref.current.getBoundingClientRect().height);
            }
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 70%", "end 55%"],
    });
    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div ref={ref} className="relative">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex justify-start gap-4 pb-12 last:pb-0 md:gap-6"
                    >
                        <div className="sticky top-24 z-10 flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full border border-rule bg-card">
                            <span className="h-2 w-2 rounded-full bg-signal" />
                        </div>
                        <div className="min-w-0 flex-1">
                            {item.title}
                            {item.content}
                        </div>
                    </div>
                ))}
                <div
                    style={{ height: height ? `${height}px` : undefined }}
                    className="absolute top-0 left-[13px] w-px overflow-hidden bg-rule/60 [mask-image:linear-gradient(to_bottom,black_0%,black_92%,transparent_100%)]"
                    aria-hidden="true"
                >
                    {reduceMotion ? (
                        <div className="absolute inset-0 bg-signal/60" />
                    ) : (
                        <motion.div
                            style={{
                                height: heightTransform,
                                opacity: opacityTransform,
                            }}
                            className="absolute inset-x-0 top-0 bg-gradient-to-b from-signal via-signal/70 to-transparent"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
