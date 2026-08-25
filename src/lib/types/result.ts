/**
 * Represents a successful operation result containing a value.
 *
 * @template T - Type of the successful value.
 */
export interface Ok<T> {
  /** Discriminant property indicating success. */
  readonly ok: true;
  /** The encapsulated success payload value. */
  readonly value: T;
  /** Unused property to enforce strict type discrimination. */
  readonly error?: never;
}

/**
 * Represents a failed operation result containing an error.
 *
 * @template E - Type of the error object or reason.
 */
export interface Err<E> {
  /** Discriminant property indicating failure. */
  readonly ok: false;
  /** The encapsulated error reason or instance. */
  readonly error: E;
  /** Unused property to enforce strict type discrimination. */
  readonly value?: never;
}

/**
 * Discriminated union type representing either a successful outcome (`Ok<T>`) or a failure outcome (`Err<E>`).
 *
 * @template T - Type of the success value.
 * @template E - Type of the failure error (defaults to Error).
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Creates a successful Result instance containing the provided value.
 *
 * @template T - Type of the payload value.
 * @param value - The success value to wrap.
 * @returns An Ok result wrapping the value.
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Creates a failed Result instance containing the provided error.
 *
 * @template E - Type of the error object.
 * @param error - The error to wrap.
 * @returns An Err result wrapping the error.
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Type guard that checks if a Result is a successful `Ok` variant.
 *
 * @template T - Type of the success value.
 * @template E - Type of the error.
 * @param result - The Result instance to check.
 * @returns True if result is Ok<T>, enabling type narrowing.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

/**
 * Type guard that checks if a Result is a failed `Err` variant.
 *
 * @template T - Type of the success value.
 * @template E - Type of the error.
 * @param result - The Result instance to check.
 * @returns True if result is Err<E>, enabling type narrowing.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false;
}

/**
 * Extracts and returns the contained value if the Result is Ok, or throws the contained error if Err.
 *
 * @template T - Type of the success value.
 * @template E - Type of the error.
 * @param result - The Result instance to unwrap.
 * @returns The inner value of type T.
 * @throws {E} The inner error if result is Err.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

/**
 * Returns the contained value if Ok, or returns the provided fallback default value if Err.
 *
 * @template T - Type of the success value.
 * @template E - Type of the error.
 * @param result - The Result instance to unwrap.
 * @param defaultValue - Fallback value returned when result is Err.
 * @returns The inner value if Ok, otherwise defaultValue.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Returns the contained value if Ok, or computes and returns a fallback value from the error using a callback.
 *
 * @template T - Type of the success value.
 * @template E - Type of the error.
 * @param result - The Result instance to unwrap.
 * @param fn - Function computing a fallback value given the inner error.
 * @returns The inner value if Ok, otherwise the computed fallback value.
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T {
  if (isOk(result)) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * Transforms the inner value of an Ok Result using a mapping function, leaving Err untouched.
 *
 * @template T - Original success value type.
 * @template U - Transformed success value type.
 * @template E - Error type.
 * @param result - The Result instance to transform.
 * @param fn - Transformation function applied to the success value.
 * @returns A new Result with the transformed value or original error.
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Transforms the inner error of an Err Result using a mapping function, leaving Ok untouched.
 *
 * @template T - Success value type.
 * @template E - Original error type.
 * @template F - Transformed error type.
 * @param result - The Result instance to transform.
 * @param fn - Transformation function applied to the error value.
 * @returns A new Result with the original value or transformed error.
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chains a computation that returns another Result on the success value of the current Result.
 *
 * @template T - Initial success value type.
 * @template U - Subsequent success value type.
 * @template E - Error type.
 * @param result - The Result instance to chain.
 * @param fn - Function receiving value T and returning Result<U, E>.
 * @returns The resulting Result from fn if Ok, or the original Err.
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}

/**
 * Wraps a synchronous operation that may throw into a safe Result type.
 *
 * @template T - Return type of the executed function.
 * @param fn - Synchronous function to execute.
 * @returns An Ok result containing the return value, or an Err result containing the caught error.
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Wraps an asynchronous promise-returning operation that may throw or reject into a safe Result type.
 *
 * @template T - Resolved type of the executed promise.
 * @param fn - Async function to execute.
 * @returns A promise resolving to an Ok result with the resolved value, or an Err result with the caught error.
 */
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

/**
 * Combines an array of Results into a single Result containing an array of values.
 * If any Result is an Err, the first encountered Err is returned immediately.
 *
 * @template T - Success value type of each element.
 * @template E - Error type.
 * @param results - Array of Result instances to combine.
 * @returns An Ok result containing an array of all values, or the first encountered Err result.
 */
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

/**
 * Pattern-matches against a Result instance by invoking the corresponding ok or err handler.
 *
 * @template T - Success value type.
 * @template E - Error type.
 * @template U - Return type of both handler functions.
 * @param result - The Result instance to pattern-match against.
 * @param handlers - Object containing handler functions for `ok` and `err` cases.
 * @param handlers.ok - Handler function executed if result is Ok.
 * @param handlers.err - Handler function executed if result is Err.
 * @returns The return value from the matched handler function.
 */
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

