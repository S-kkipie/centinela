export type Ok<T> = { ok: true; data: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> =>
    !result.ok;

export const matchResult = <T, E, R>(
    result: Result<T, E>,
    handlers: { ok: (data: T) => R; err: (error: E) => R },
): R => (result.ok ? handlers.ok(result.data) : handlers.err(result.error));
