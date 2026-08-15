"use client";

import { motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { Fragment, useEffect } from "react";
import { cn } from "@/frontend/lib/utils";

/**
 * Aceternity "Text Generate Effect", recolored to inherit the surrounding
 * ink color (no hardcoded black/white) and instant under reduced motion.
 */
export const TextGenerateEffect = ({
    words,
    className,
    filter = true,
    duration = 0.5,
    staggerDelay = 0.08,
}: {
    words: string;
    className?: string;
    filter?: boolean;
    duration?: number;
    staggerDelay?: number;
}) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();
    const wordsArray = words.split(" ");

    useEffect(() => {
        animate(
            "span",
            {
                opacity: 1,
                filter: filter ? "blur(0px)" : "none",
            },
            reduceMotion
                ? { duration: 0 }
                : { duration, delay: stagger(staggerDelay) },
        );
    }, [animate, duration, filter, reduceMotion, staggerDelay]);

    return (
        <div ref={scope} className={cn(className)}>
            {wordsArray.map((word, idx) => (
                <Fragment key={`${word}-${idx}`}>
                    <motion.span
                        className="inline-block opacity-0"
                        style={{ filter: filter ? "blur(8px)" : "none" }}
                    >
                        {word}
                    </motion.span>
                    {idx < wordsArray.length - 1 ? " " : null}
                </Fragment>
            ))}
        </div>
    );
};
