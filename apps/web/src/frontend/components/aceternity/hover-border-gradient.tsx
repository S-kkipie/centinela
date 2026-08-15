"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ElementType, HTMLAttributes, PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/frontend/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

/**
 * Aceternity "Hover Border Gradient", recolored to the intel tokens:
 * ink-filled command button with a thin rotating verde-esmeralda sheen.
 * Rectangular (4px radius) per the design system — no pills.
 */
export function HoverBorderGradient({
    children,
    containerClassName,
    className,
    as: Tag = "button",
    duration = 1.6,
    clockwise = true,
    ...props
}: PropsWithChildren<
    {
        as?: ElementType;
        containerClassName?: string;
        className?: string;
        duration?: number;
        clockwise?: boolean;
    } & HTMLAttributes<HTMLElement>
>) {
    const [hovered, setHovered] = useState(false);
    const [direction, setDirection] = useState<Direction>("TOP");
    const reduceMotion = useReducedMotion();

    const movingMap: Record<Direction, string> = {
        TOP: "radial-gradient(20.7% 50% at 50% 0%, var(--color-accent-signal) 0%, transparent 100%)",
        LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, var(--color-accent-signal) 0%, transparent 100%)",
        BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, var(--color-accent-signal) 0%, transparent 100%)",
        RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, var(--color-accent-signal) 0%, transparent 100%)",
    };

    const highlight =
        "radial-gradient(75% 181% at 50% 50%, var(--color-accent-signal) 0%, transparent 100%)";

    useEffect(() => {
        if (!hovered && !reduceMotion) {
            const interval = setInterval(() => {
                setDirection((prevState) => {
                    const directions: Direction[] = [
                        "TOP",
                        "LEFT",
                        "BOTTOM",
                        "RIGHT",
                    ];
                    const currentIndex = directions.indexOf(prevState);
                    const nextIndex = clockwise
                        ? (currentIndex - 1 + directions.length) %
                          directions.length
                        : (currentIndex + 1) % directions.length;
                    return directions[nextIndex] as Direction;
                });
            }, duration * 1000);
            return () => clearInterval(interval);
        }
    }, [hovered, reduceMotion, clockwise, duration]);

    return (
        <Tag
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center gap-10 overflow-visible rounded-md border border-rule p-px decoration-clone transition duration-500",
                containerClassName,
            )}
            {...props}
        >
            <div
                className={cn(
                    "z-10 w-auto rounded-[inherit] bg-foreground px-6 py-3 text-background",
                    className,
                )}
            >
                {children}
            </div>
            <motion.div
                aria-hidden="true"
                className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit] motion-reduce:hidden"
                style={{
                    filter: "blur(2px)",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                }}
                initial={{ background: movingMap[direction] }}
                animate={{
                    background: hovered
                        ? [movingMap[direction], highlight]
                        : movingMap[direction],
                }}
                transition={{ ease: "linear", duration: duration ?? 1 }}
            />
            <div className="absolute inset-[2px] z-[1] flex-none rounded-[3px] bg-foreground" />
        </Tag>
    );
}
