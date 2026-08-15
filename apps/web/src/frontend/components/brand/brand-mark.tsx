import type { SVGProps } from "react";

/**
 * The Centinela "eye" mark. Eyelids inherit `currentColor` so it adapts to its
 * context (light on the dark console, ink on paper); the pupil is always the
 * esmeralda signal color. Decorative by default — pair it with the wordmark.
 */
export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            aria-hidden
            className={className}
            fill="none"
            viewBox="0 0 256 256"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                fill="currentColor"
                d="M28 119 80 68h96l52 51-17 17-43-42H88l-43 42Z"
            />
            <path
                fill="currentColor"
                d="m28 137 17-17 43 42h80l43-42 17 17-52 51H80Z"
            />
            <path
                fill="var(--color-signal)"
                fillRule="evenodd"
                d="M128 96a32 32 0 1 1 0 64 32 32 0 0 1 0-64Zm-4 12h8v40h-8Z"
            />
        </svg>
    );
}
