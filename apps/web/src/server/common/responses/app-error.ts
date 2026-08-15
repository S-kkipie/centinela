import type { Result } from "./result";

export type AppError =
    | {
          type: "ValidationError";
          code: "INVALID_BODY" | "INVALID_ID" | "INVALID_QUERY";
          status: 400;
          targets?: string[];
          cause?: unknown;
      }
    | {
          type: "UnauthorizedError";
          code: "UNAUTHORIZED";
          status: 401;
          cause?: unknown;
      }
    | {
          type: "ForbiddenError";
          code: "FORBIDDEN";
          status: 403;
          cause?: unknown;
      }
    | {
          type: "NotFoundError";
          code: "NOT_FOUND";
          status: 404;
          targets?: string[];
          cause?: unknown;
      }
    | {
          type: "ConflictError";
          code: "CONFLICT";
          status: 409;
          targets?: string[];
          cause?: unknown;
      }
    | {
          type: "TooManyRequestsError";
          code: "TOO_MANY_REQUESTS";
          status: 429;
          cause?: unknown;
      }
    | {
          type: "UnprocessableEntityError";
          code: "UNPROCESSABLE_ENTITY";
          status: 422;
          targets?: string[];
          cause?: unknown;
      }
    | {
          type: "UnexpectedError";
          code: "INTERNAL_SERVER_ERROR";
          status: 500;
          cause: unknown;
      };

export type AppResult<T> = Result<T, AppError>;
export type AsyncAppResult<T> = Promise<AppResult<T>>;

export const AppErrors = {
    invalidBody(params?: {
        code?: "INVALID_BODY";
        targets?: string[];
        cause?: unknown;
    }): AppError {
        return {
            type: "ValidationError",
            code: params?.code ?? "INVALID_BODY",
            status: 400,
            targets: params?.targets,
            cause: params?.cause,
        };
    },
    invalidId(params?: { targets?: string[]; cause?: unknown }): AppError {
        return {
            type: "ValidationError",
            code: "INVALID_ID",
            status: 400,
            targets: params?.targets,
            cause: params?.cause,
        };
    },
    invalidQuery(params?: { targets?: string[]; cause?: unknown }): AppError {
        return {
            type: "ValidationError",
            code: "INVALID_QUERY",
            status: 400,
            targets: params?.targets,
            cause: params?.cause,
        };
    },
    unauthorized(cause?: unknown): AppError {
        return {
            type: "UnauthorizedError",
            code: "UNAUTHORIZED",
            status: 401,
            cause,
        };
    },
    forbidden(cause?: unknown): AppError {
        return {
            type: "ForbiddenError",
            code: "FORBIDDEN",
            status: 403,
            cause,
        };
    },
    notFound(params?: { targets?: string[]; cause?: unknown }): AppError {
        return {
            type: "NotFoundError",
            code: "NOT_FOUND",
            status: 404,
            targets: params?.targets,
            cause: params?.cause,
        };
    },
    conflict(params?: { targets?: string[]; cause?: unknown }): AppError {
        return {
            type: "ConflictError",
            code: "CONFLICT",
            status: 409,
            targets: params?.targets,
            cause: params?.cause,
        };
    },
    tooManyRequests(params?: { cause?: unknown }): AppError {
        return {
            type: "TooManyRequestsError",
            code: "TOO_MANY_REQUESTS",
            status: 429,
            cause: params?.cause,
        };
    },
    unprocessableEntity(params?: {
        targets?: string[];
        cause?: unknown;
    }): AppError {
        return {
            type: "UnprocessableEntityError",
            code: "UNPROCESSABLE_ENTITY",
            status: 422,
            targets: params?.targets,
            cause: params?.cause,
        };
    },
    unexpected(cause: unknown): AppError {
        return {
            type: "UnexpectedError",
            code: "INTERNAL_SERVER_ERROR",
            status: 500,
            cause,
        };
    },
} as const;
