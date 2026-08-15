import { getLogger } from "@logtape/logtape";
import type { APIErrorResponse } from "./api";
import type { AppError } from "./app-error";

const errorLogger = getLogger(["server", "error"]);

const normalizeWhitespace = (value: string): string =>
    value.replaceAll(/\s+/g, " ").trim();

const formatErrorCause = (cause: unknown): string => {
    if (cause == null) return "Unknown error";
    if (cause instanceof Error) {
        const message = normalizeWhitespace(cause.message);
        return message ? `${cause.name}: ${message}` : cause.name;
    }
    if (typeof cause === "string") return normalizeWhitespace(cause);
    try {
        return normalizeWhitespace(JSON.stringify(cause));
    } catch {
        return String(cause);
    }
};

export const errorToResponse = (error: AppError): APIErrorResponse => {
    // 5xx: surface the real cause to the server log (wire response hides it).
    // 4xx are expected control flow and stay quiet.
    if (error.status >= 500) {
        const cause = "cause" in error ? error.cause : undefined;
        errorLogger.error("Server error {code}: {cause}", {
            code: error.code,
            cause: formatErrorCause(cause),
        });
    }
    return {
        code: error.code,
        status: error.status,
        targets: "targets" in error ? error.targets : undefined,
    };
};
