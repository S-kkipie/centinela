import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of the `x-agent-key` header against the shared
 * ingest secret. Length mismatch short-circuits to false (timingSafeEqual
 * throws on unequal-length buffers); equal lengths are compared without an
 * early-exit that would leak timing.
 */
export function matchesAgentKey(
    provided: string | null | undefined,
    expected: string,
): boolean {
    if (!provided) return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}
