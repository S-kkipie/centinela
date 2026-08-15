import { format, formatDistance } from "date-fns";
import { es } from "date-fns/locale";

/** Formats a date as a long Spanish absolute date (e.g. "9 de julio de 2026"). */
export function formatDate(
    date: Date | string | number | null | undefined,
): string {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formats an ISO instant as a short Lima-time label (e.g. "sáb 12 jul, 3:00 p. m.").
 * Uses `Intl` rather than date-fns because pinning the output to `America/Lima`
 * regardless of the viewer's own timezone needs the `timeZone` option, which
 * date-fns core cannot express without the `date-fns-tz` package.
 */
export function formatLimaDateTime(
    date: Date | string | number | null | undefined,
): string {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat("es-PE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Lima",
    }).format(parsed);
}

/**
 * Formats a date as a Spanish relative distance from `now` with a suffix
 * (e.g. "hace 5 días", "hace alrededor de 1 mes"). Empty string for nullish or
 * unparseable input.
 *
 * @param date - Date, ISO string, epoch ms, or nullish.
 * @param now - Reference epoch ms (injectable for tests); defaults to `Date.now()`.
 */
export function formatRelativeTime(
    date: Date | string | number | null | undefined,
    now: number = Date.now(),
): string {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";

    return formatDistance(parsed, now, { addSuffix: true, locale: es });
}

export function formatNumber(num: number): string {
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Formats a `cents` amount in PEN as a localized currency string with no
 * decimals (e.g. `34900` → `"S/ 349"`).
 */
export function formatSoles(cents: number): string {
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

/**
 * Formats a duration in seconds as `m:ss` (or `h:mm:ss` past an hour), e.g.
 * `252` → `"4:12"`.
 */
export function formatDuration(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    const paddedSeconds = String(seconds).padStart(2, "0");
    if (hours > 0) {
        const paddedMinutes = String(minutes).padStart(2, "0");
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${minutes}:${paddedSeconds}`;
}

/** Extracts the API error `code` from an Eden treaty error envelope, if present. */
function apiErrorCode(error: unknown): string | undefined {
    if (
        typeof error === "object" &&
        error !== null &&
        "value" in error &&
        typeof (error as { value?: unknown }).value === "object" &&
        (error as { value: unknown }).value !== null
    ) {
        const { code } = (error as { value: { code?: unknown } }).value;
        if (typeof code === "string") return code;
    }
    return undefined;
}

/**
 * Maps any API / Eden error to a neutral, user-facing Spanish message by its error
 * `code`. Always returns a string — never the raw object — so a thrown Eden error
 * can no longer render as `[object Object]`.
 */
export function apiErrorMessage(error: unknown): string {
    switch (apiErrorCode(error)) {
        case "NOT_FOUND":
            return "Este contenido ya no está disponible.";
        case "UNAUTHORIZED":
            return "Tu sesión expiró. Vuelve a iniciar sesión.";
        case "FORBIDDEN":
            return "No tienes acceso a este recurso.";
        case "INVALID_BODY":
        case "INVALID_ID":
        case "INVALID_QUERY":
        case "UNPROCESSABLE_ENTITY":
            return "Revisa los datos e intenta de nuevo.";
        case "CONFLICT":
            return "Ya existe un registro con estos datos.";
        case "INTERNAL_SERVER_ERROR":
            return "Tuvimos un problema en el servidor. Intenta más tarde.";
        default:
            return "Algo falló. Intenta de nuevo.";
    }
}

/**
 * Maps an Eden mutation error to a user-facing Spanish message.
 *
 * Falls back to a generic message when the error shape is unknown so the UI
 * never surfaces raw stack traces or English strings to the student.
 */
export function formatErrorMessage(error: unknown): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "value" in error &&
        typeof (error as { value?: unknown }).value === "object"
    ) {
        const value = (
            error as {
                value: { code?: string; targets?: string[] };
            }
        ).value;
        const targets = value.targets ?? [];
        if (value.code === "CONFLICT") {
            return "Ya estás inscrito en este curso.";
        }
        if (value.code === "NOT_FOUND" && targets.includes("lessonId")) {
            return "Esa lección no existe o no tienes acceso.";
        }
        if (value.code === "NOT_FOUND" && targets.includes("courseId")) {
            return "No tienes acceso a este curso. Inscríbete para continuar.";
        }
        if (value.code === "NOT_FOUND") {
            return "Ese curso ya no está disponible.";
        }
        if (value.code === "UNAUTHORIZED") {
            return "Tu sesión expiró. Vuelve a iniciar sesión.";
        }
    }
    return "Algo falló. Intenta de nuevo.";
}
