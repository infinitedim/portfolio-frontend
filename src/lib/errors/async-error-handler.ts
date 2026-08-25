import {
  EnhancedError,
  ErrorCategory,
  ErrorSeverity,
  NetworkError,
  ErrorUtils,
} from "./error-types";

/**
 * Configuration options for managing exponential backoff and retry behavior of asynchronous operations.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts permitted before failing. */
  maxRetries: number;
  /** Initial base delay in milliseconds before the first retry attempt. */
  baseDelay: number;
  /** Upper bound ceiling for retry delays in milliseconds. */
  maxDelay: number;
  /** Exponential backoff multiplier factor applied between consecutive retry attempts. */
  backoffFactor: number;
  /** Optional custom predicate determining if a specific error and attempt count qualify for a retry. */
  retryCondition?: (error: Error, attempt: number) => boolean;
  /** Optional callback invoked on each retry attempt with error and attempt index. */
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Execution parameters and lifecycle hooks for async error handler workflows.
 */
export interface AsyncErrorHandlerConfig {
  /** Operation timeout duration in milliseconds before timing out. */
  timeout?: number;
  /** Retry policy and backoff settings. */
  retryConfig?: RetryConfig;
  /** Fallback data value returned when the operation fails. */
  fallbackValue?: unknown;
  /** Error event listener invoked whenever an exception occurs. */
  onError?: (error: Error) => void;
  /** Success callback invoked with the resolved execution result. */
  onSuccess?: (result: unknown) => void;
}

/**
 * Encapsulated result container from an async execution managed by {@link AsyncErrorHandler}.
 *
 * @template T - The resolved data payload type.
 */
export interface AsyncResult<T> {
  /** Indicates whether the operation completed successfully without error. */
  success: boolean;
  /** Resolved data payload when successful. */
  data?: T;
  /** Enhanced error descriptor if the operation failed. */
  error?: EnhancedError;
  /** Count of retry attempts made before completing or failing. */
  retryCount: number;
  /** Total elapsed execution duration in milliseconds. */
  duration: number;
}

/**
 * Default retry strategy configuration with 3 retries and exponential backoff.
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => ErrorUtils.isRetryable(error),
};

/**
 * Singleton service orchestrating robust asynchronous execution with configurable retries,
 * timeout races, exponential backoff, and aggregated error reporting.
 */
export class AsyncErrorHandler {
  private static instance: AsyncErrorHandler;

  /**
   * Retrieves or initializes the shared singleton instance of `AsyncErrorHandler`.
   *
   * @returns The singleton {@link AsyncErrorHandler} instance.
   */
  static getInstance(): AsyncErrorHandler {
    if (!AsyncErrorHandler.instance) {
      AsyncErrorHandler.instance = new AsyncErrorHandler();
    }
    return AsyncErrorHandler.instance;
  }

  /**
   * Executes an asynchronous task with timeout enforcement, exponential backoff retries,
   * error enhancement, and lifecycle event notifications.
   *
   * @param fn - The asynchronous function to execute.
   * @param config - Optional configuration overrides for timeout, retries, and event callbacks.
   * @returns Promise resolving to an {@link AsyncResult} object with status, data, and metrics.
   *
   * @example
   * ```ts
   * const handler = AsyncErrorHandler.getInstance();
   * const res = await handler.execute(() => fetchUserData(id), { timeout: 5000 });
   * if (res.success) console.log(res.data);
   * ```
   */
  async execute<T>(
    fn: () => Promise<T>,
    config: AsyncErrorHandlerConfig = {},
  ): Promise<AsyncResult<T>> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: EnhancedError | undefined;

    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };

    while (retryCount <= retryConfig.maxRetries) {
      try {
        const result = config.timeout
          ? await this.withTimeout(fn(), config.timeout)
          : await fn();

        const duration = Date.now() - startTime;

        config.onSuccess?.(result);

        return {
          success: true,
          data: result,
          retryCount,
          duration,
        };
      } catch (error) {
        const enhancedError = ErrorUtils.enhance(error as Error);
        lastError = enhancedError;

        config.onError?.(enhancedError);

        const shouldRetry =
          retryCount < retryConfig.maxRetries &&
          (retryConfig.retryCondition?.(enhancedError, retryCount) ??
            enhancedError.isRetryable);

        if (!shouldRetry) {
          break;
        }

        retryCount++;

        retryConfig.onRetry?.(enhancedError, retryCount - 1);

        const delay = Math.min(
          retryConfig.baseDelay *
            Math.pow(retryConfig.backoffFactor, retryCount - 1),
          retryConfig.maxDelay,
        );

        await this.delay(delay);
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: false,
      error: lastError,
      retryCount,
      duration,
    };
  }

  /**
   * Executes a batch of asynchronous tasks sequentially or with fail-fast semantics,
   * aggregating successes, errors, and retry attempts.
   *
   * @param functions - Array of asynchronous functions to execute.
   * @param config - Configuration options including failFast mode and retry settings.
   * @returns Promise resolving to an aggregated {@link AsyncResult} array.
   */
  async executeAll<T>(
    functions: Array<() => Promise<T>>,
    config: AsyncErrorHandlerConfig & { failFast?: boolean } = {},
  ): Promise<AsyncResult<T[]>> {
    const results: AsyncResult<T>[] = [];
    const successfulResults: T[] = [];
    const errors: EnhancedError[] = [];
    let totalRetryCount = 0;
    const startTime = Date.now();

    for (const fn of functions) {
      const result = await this.execute(fn, config);
      results.push(result);
      totalRetryCount += result.retryCount;

      if (result.success) {
        successfulResults.push(result.data as T);
      } else {
        if (result.error) {
          errors.push(result.error);
        }

        if (config.failFast) {
          break;
        }
      }
    }

    const duration = Date.now() - startTime;
    const hasErrors = errors.length > 0;

    if (hasErrors && config.failFast) {
      return {
        success: false,
        error: errors[0],
        retryCount: totalRetryCount,
        duration,
      };
    }

    return {
      success: !hasErrors,
      data: successfulResults,
      error: hasErrors ? this.combineErrors(errors) : undefined,
      retryCount: totalRetryCount,
      duration,
    };
  }

  /**
   * Races an asynchronous promise against a timeout rejection promise.
   *
   * @param promise - The async operation promise.
   * @param timeout - Timeout duration in milliseconds.
   * @returns Promise resolving to the operation result if completed in time.
   * @throws NetworkError if the timeout threshold is exceeded.
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((resolve, reject) => {
      setTimeout(() => {
        reject(
          new NetworkError(`Operation timed out after ${timeout}ms`, {
            severity: ErrorSeverity.HIGH,
            suggestions: [
              "Try again with a longer timeout",
              "Check your internet connection",
              "Contact support if the problem persists",
            ],
          }),
        );
      }, timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Pauses execution for a specified duration in milliseconds.
   *
   * @param ms - Delay duration in milliseconds.
   * @returns Promise resolving when the delay concludes.
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Aggregates multiple enhanced errors into a single unified `EnhancedError` container.
   *
   * @param errors - List of enhanced errors to combine.
   * @returns Consolidated {@link EnhancedError} with merged messages and highest severity.
   */
  private combineErrors(errors: EnhancedError[]): EnhancedError {
    const messages = errors.map((e) => e.message).join("; ");
    const categories = [...new Set(errors.map((e) => e.category))];
    const maxSeverity = errors.reduce((max, e) => {
      const severityOrder = [
        ErrorSeverity.LOW,
        ErrorSeverity.MEDIUM,
        ErrorSeverity.HIGH,
        ErrorSeverity.CRITICAL,
      ];
      return severityOrder.indexOf(e.severity) > severityOrder.indexOf(max)
        ? e.severity
        : max;
    }, ErrorSeverity.LOW);

    return new EnhancedError(`Multiple errors occurred: ${messages}`, {
      category: categories.length === 1 ? categories[0] : ErrorCategory.UNKNOWN,
      severity: maxSeverity,
      isRetryable: errors.some((e) => e.isRetryable),
      suggestions: [
        "Multiple issues were encountered",
        "Try addressing each issue individually",
        "Contact support if problems persist",
      ],
    });
  }
}

/**
 * Utility collection for resilient async execution, circuit breakers, and batch processing.
 */
export class AsyncUtils {
  /**
   * Executes an asynchronous function safely without throwing, returning data or enhanced error.
   *
   * @param fn - The async function to execute.
   * @param fallbackValue - Optional fallback value returned upon error.
   * @returns Promise resolving to an object containing data or error.
   */
  static async safe<T>(
    fn: () => Promise<T>,
    fallbackValue?: T,
  ): Promise<{ data?: T; error?: EnhancedError }> {
    try {
      const data = await fn();
      return { data };
    } catch (error) {
      return {
        data: fallbackValue,
        error: ErrorUtils.enhance(error as Error),
      };
    }
  }

  /**
   * Executes an async operation with automatic retry logic using the singleton error handler.
   *
   * @param fn - The async function to execute.
   * @param config - Partial retry configuration overrides.
   * @returns Promise resolving to the successfully returned value.
   * @throws The final error if all retry attempts fail.
   */
  static async retry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
  ): Promise<T> {
    const handler = AsyncErrorHandler.getInstance();
    const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const result = await handler.execute(fn, { retryConfig: mergedConfig });

    if (result.success) {
      return result.data as T;
    }

    throw result.error || new Error("Retry failed");
  }

  /**
   * Creates a circuit-breaker wrapper around an asynchronous function to prevent cascading failures.
   *
   * @param fn - Target async function protected by the circuit breaker.
   * @param config - Failure threshold and timeout parameters.
   * @param config.failureThreshold - Number of failures before tripping the circuit.
   * @param config.resetTimeout - Time in milliseconds before attempting reset to half-open.
   * @param config.monitoringPeriod - Window of time in milliseconds for monitoring failure rate.
   * @returns Wrapped function enforcing CLOSED, OPEN, and HALF_OPEN state transitions.
   */
  static createCircuitBreaker<T>(
    fn: () => Promise<T>,
    config: {
      failureThreshold: number;
      resetTimeout: number;
      monitoringPeriod: number;
    } = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 60000,
    },
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

    return async (): Promise<T> => {
      const now = Date.now();

      if (now - lastFailureTime > config.monitoringPeriod) {
        failures = 0;
      }

      if (state === "OPEN") {
        if (now - lastFailureTime > config.resetTimeout) {
          state = "HALF_OPEN";
        } else {
          throw new NetworkError("Circuit breaker is OPEN", {
            severity: ErrorSeverity.HIGH,
            suggestions: [
              "Service is temporarily unavailable",
              "Try again later",
              "Contact support if the issue persists",
            ],
          });
        }
      }

      try {
        const result = await fn();

        if (state === "HALF_OPEN") {
          state = "CLOSED";
          failures = 0;
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= config.failureThreshold) {
          state = "OPEN";
        }

        throw error;
      }
    };
  }

  /**
   * Processes an array of items in concurrent batches with error tracking and summary metrics.
   *
   * @param items - Collection of items to process.
   * @param processor - Async processing handler for each individual item.
   * @param options - Batch size, concurrency level, and error continuation options.
   * @param options.batchSize - Maximum number of items per execution batch.
   * @param options.concurrency - Maximum number of concurrent tasks per batch.
   * @param options.continueOnError - Whether to continue processing remaining items if an error occurs.
   * @returns Promise resolving to individual results and batch summary statistics.
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      concurrency?: number;
      continueOnError?: boolean;
    } = {},
  ): Promise<{
    results: Array<{
      success: boolean;
      data?: R;
      error?: EnhancedError;
      item: T;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      errors: EnhancedError[];
    };
  }> {
    const { batchSize = 10, concurrency = 3, continueOnError = true } = options;
    const results: Array<{
      success: boolean;
      data?: R;
      error?: EnhancedError;
      item: T;
    }> = [];
    const errors: EnhancedError[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchPromises = batch.map(async (item) => {
        const { data, error } = await AsyncUtils.safe(() => processor(item));

        const result = {
          success: !error,
          data,
          error,
          item,
        };

        if (error) {
          errors.push(error);

          if (!continueOnError) {
            throw error;
          }
        }

        return result;
      });

      const batchResults = await Promise.all(
        batchPromises.slice(0, concurrency),
      );
      results.push(...batchResults);

      if (batch.length > concurrency) {
        const remainingPromises = batchPromises.slice(concurrency);
        const remainingResults = await Promise.all(remainingPromises);
        results.push(...remainingResults);
      }
    }

    return {
      results,
      summary: {
        total: items.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        errors,
      },
    };
  }
}

/**
 * Method decorator that wraps async class methods with {@link AsyncErrorHandler} protection.
 *
 * @param config - Error handler configuration settings.
 * @returns Method decorator function wrapping the target method with error handling and retries.
 */
export function handleAsync(config?: AsyncErrorHandlerConfig) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const handler = AsyncErrorHandler.getInstance();
      const result = await handler.execute(
        () => originalMethod.apply(this, args),
        config,
      );

      if (result.success) {
        return result.data;
      }

      throw result.error;
    };

    return descriptor;
  };
}

/**
 * Custom React hook exposing async execution helpers, retries, and batch processing utilities.
 *
 * @returns Object containing `execute`, `executeAll`, `safe`, `retry`, and `processBatch` helpers.
 *
 * @example
 * ```tsx
 * const { safe, retry } = useAsyncErrorHandler();
 * const { data, error } = await safe(() => api.fetchUser());
 * ```
 */
export function useAsyncErrorHandler() {
  const handler = AsyncErrorHandler.getInstance();

  return {
    execute: handler.execute.bind(handler),
    executeAll: handler.executeAll.bind(handler),
    safe: AsyncUtils.safe,
    retry: AsyncUtils.retry,
    processBatch: AsyncUtils.processBatch,
  };
}
