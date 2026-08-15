export const STATUS_MAP = {
    200: "OK",
    201: "CREATED",
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
} as const;

export type ApiStatus = keyof typeof STATUS_MAP;
export type ApiErrorStatus = Exclude<ApiStatus, 200 | 201>;
export type ApiStatusText = (typeof STATUS_MAP)[ApiStatus];
