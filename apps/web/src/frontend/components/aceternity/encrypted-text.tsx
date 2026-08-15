"use client";
// Aceternity "Encrypted Text" — scramble-decrypt on scroll into view.
// Adapted: cn path, reduced-motion renders the plain text immediately.
import { motion, useInView, useReducedMotion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/frontend/lib/utils";

type EncryptedTextProps = {
    text: string;
    className?: string;
    /** ms between revealing each subsequent real character. */
    revealDelayMs?: number;
    /** Custom character set for the gibberish effect. */
    charset?: string;
    /** ms between gibberish flips for unrevealed characters. */
    flipDelayMs?: number;
    encryptedClassName?: string;
    revealedClassName?: string;
};

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-<>/";

function randomChar(charset: string): string {
    return charset.charAt(Math.floor(Math.random() * charset.length));
}

/** Deterministic scramble so SSR and first client render match (no hydration mismatch). */
function seededChar(charset: string, index: number): string {
    return charset.charAt((index * 13 + 7) % charset.length);
}

function seededGibberish(original: string, charset: string): string {
    let result = "";
    for (let i = 0; i < original.length; i += 1) {
        result += original[i] === " " ? " " : seededChar(charset, i);
    }
    return result;
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
    text,
    className,
    revealDelayMs = 50,
    charset = DEFAULT_CHARSET,
    flipDelayMs = 50,
    encryptedClassName,
    revealedClassName,
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const reduceMotion = useReducedMotion();

    const [revealCount, setRevealCount] = useState(0);
    const frameRef = useRef<number | null>(null);
    const startRef = useRef(0);
    const lastFlipRef = useRef(0);
    const scrambleRef = useRef<string[]>(
        text ? seededGibberish(text, charset).split("") : [],
    );

    useEffect(() => {
        if (!isInView) return;
        if (reduceMotion) {
            setRevealCount(text.length);
            return;
        }

        scrambleRef.current = seededGibberish(text, charset).split("");
        startRef.current = performance.now();
        lastFlipRef.current = startRef.current;
        setRevealCount(0);

        let cancelled = false;

        const update = (now: number) => {
            if (cancelled) return;
            const elapsed = now - startRef.current;
            const total = text.length;
            const current = Math.min(
                total,
                Math.floor(elapsed / Math.max(1, revealDelayMs)),
            );
            setRevealCount(current);
            if (current >= total) return;

            if (now - lastFlipRef.current >= Math.max(0, flipDelayMs)) {
                for (let i = current; i < total; i += 1) {
                    scrambleRef.current[i] =
                        text[i] === " " ? " " : randomChar(charset);
                }
                lastFlipRef.current = now;
            }
            frameRef.current = requestAnimationFrame(update);
        };

        frameRef.current = requestAnimationFrame(update);
        return () => {
            cancelled = true;
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [isInView, reduceMotion, text, revealDelayMs, charset, flipDelayMs]);

    if (!text) return null;

    return (
        <motion.span ref={ref} className={cn(className)} aria-label={text}>
            {text.split("").map((char, index) => {
                const isRevealed = index < revealCount;
                const display = isRevealed
                    ? char
                    : char === " "
                      ? " "
                      : (scrambleRef.current[index] ??
                        seededChar(charset, index));
                return (
                    <span
                        key={index}
                        aria-hidden="true"
                        className={cn(
                            isRevealed ? revealedClassName : encryptedClassName,
                        )}
                    >
                        {display}
                    </span>
                );
            })}
        </motion.span>
    );
};
