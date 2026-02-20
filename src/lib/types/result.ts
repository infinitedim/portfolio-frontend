

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
  readonly error?: never;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
  readonly value?: never;
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T {
  if (isOk(result)) {
    return result.value;
  }
  return fn(result.error);
}

export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}

export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
): Promise<Result<T, Error>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
}

export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  },
): U {
  if (isOk(result)) {
    return handlers.ok(result.value);
  }
  return handlers.err(result.error);
}
