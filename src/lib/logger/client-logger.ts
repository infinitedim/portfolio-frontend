"use client";

import pino from "pino";
import type { Logger as PinoLogger } from "pino";
import {
  clientConfig,
  PERFORMANCE_THRESHOLDS,
  SAMPLING_CONFIG,
} from "./config";
import { maskPII, formatError, getRequestContext, isClient } from "./utils";
import {
  LogLevel,
  LogEntry,
  LogContext,
  ErrorLog,
  PerformanceLog,
  UserActionLog,
  SecurityLog,
  BatchConfig,
} from "./types";

/**
 * Internal in-memory log buffer structure for batching client log entries before remote transmission.
 */
interface LogBuffer {
  /** Queued log entries waiting to be transmitted. */
  logs: LogEntry[];
  /** Active timeout handle for scheduled batch flushing. */
  timer: NodeJS.Timeout | null;
  /** Number of consecutive failed delivery attempts. */
  retryCount: number;
}

/**
 * Client-side logging service wrapping Pino with remote batching, sampling, and PII masking support.
 */
class ClientLogger {
  /** Underlying Pino logger instance. */
  private pino: PinoLogger;
  /** In-memory log entry queue for batch dispatch. */
  private buffer: LogBuffer;
  /** Configuration parameters controlling batching and retry behavior. */
  private config: BatchConfig;
  /** Indicates whether client-side logging is active in the current environment. */
  private enabled: boolean;

  /**
   * Initializes the client logger instance and binds lifecycle event handlers for automatic flush on unload.
   */
  constructor() {
    if (!isClient()) {
      this.enabled = false;
      this.pino = {} as PinoLogger;
      this.buffer = { logs: [], timer: null, retryCount: 0 };
      this.config = {
        maxBatchSize: 10,
        maxBatchWait: 5000,
        maxRetries: 3,
        retryDelay: 1000,
      };
      return;
    }

    this.enabled = true;
    this.config = clientConfig.batch || {
      maxBatchSize: 10,
      maxBatchWait: 5000,
      maxRetries: 3,
      retryDelay: 1000,
    };

    const isDev = clientConfig.environment === "development";

    this.pino = pino({
      level: clientConfig.level,
      browser: isDev
        ? {
            disabled: true,
          }
        : {
            asObject: true,
            serialize: true,
          },
    });

    this.buffer = {
      logs: [],
      timer: null,
      retryCount: 0,
    };

    if (
      typeof window !== "undefined" &&
      typeof window.addEventListener === "function"
    ) {
      window.addEventListener("beforeunload", () => {
        this.flush();
      });

      if (
        typeof document !== "undefined" &&
        typeof document.addEventListener === "function"
      ) {
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            this.flush();
          }
        });
      }
    }
  }

  /**
   * Creates a child logger with bound contextual metadata.
   *
   * @param context - Additional contextual properties to attach to all subsequent logs.
   * @returns A new ClientLogger instance inheriting the parent configuration.
   */
  child(context: LogContext): ClientLogger {
    const childLogger = Object.create(this) as ClientLogger;
    childLogger.pino = this.pino.child(context);
    return childLogger;
  }

  /**
   * Evaluates whether a log entry at the specified log level should be recorded based on sampling rates.
   *
   * @param level - Log severity level to check.
   * @returns True if the log should be recorded; otherwise false.
   */
  private shouldSample(level: LogLevel): boolean {
    const rate = SAMPLING_CONFIG[level as keyof typeof SAMPLING_CONFIG] || 1.0;
    return Math.random() < rate;
  }

  /**
   * Enriches contextual log properties with ambient browser request details (URL, user agent, session ID).
   *
   * @param context - Optional caller-supplied context to merge.
   * @returns Merged contextual object.
   */
  private enrichContext(context?: LogContext): LogContext {
    const requestContext = getRequestContext();
    return {
      ...requestContext,
      ...context,
    };
  }

  /**
   * Appends a log entry into the internal transmission buffer and triggers a flush if batch size is reached.
   *
   * @param entry - The structured log entry to buffer.
   */
  private addToBuffer(entry: LogEntry): void {
    if (!clientConfig.remote || !this.enabled) {
      return;
    }

    const maskedEntry = clientConfig.maskPII
      ? {
          ...entry,
          metadata: maskPII(entry.metadata) as Record<string, unknown>,
        }
      : entry;

    this.buffer.logs.push(maskedEntry);

    if (this.buffer.logs.length >= this.config.maxBatchSize) {
      this.flush();
      return;
    }

    if (!this.buffer.timer) {
      this.buffer.timer = setTimeout(() => {
        this.flush();
      }, this.config.maxBatchWait);
    }
  }

  /**
   * Flushes buffered log entries to the remote log ingest endpoint via HTTP POST.
   *
   * @returns A promise resolving when the flush attempt completes.
   */
  async flush(): Promise<void> {
    if (!this.enabled || this.buffer.logs.length === 0) {
      return;
    }

    if (this.buffer.timer) {
      clearTimeout(this.buffer.timer);
      this.buffer.timer = null;
    }

    const logsToSend = [...this.buffer.logs];
    this.buffer.logs = [];

    try {
      const response = await fetch(clientConfig.apiEndpoint || "/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status}`);
      }

      this.buffer.retryCount = 0;
    } catch (error) {
      this.buffer.retryCount++;

      if (this.buffer.retryCount <= this.config.maxRetries) {
        const delay =
          this.config.retryDelay * Math.pow(2, this.buffer.retryCount - 1);

        console.warn(`Failed to send logs, retrying in ${delay}ms...`, error);

        this.buffer.logs.unshift(...logsToSend);

        setTimeout(() => {
          this.flush();
        }, delay);
      } else {
        console.error("Failed to send logs after max retries", error);
        this.buffer.retryCount = 0;
      }
    }
  }

  /**
   * Logs a trace-level diagnostic message.
   *
   * @param message - Diagnostic message string.
   * @param context - Optional contextual data.
   * @param metadata - Optional key-value metadata record.
   */
  trace(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled || !this.shouldSample(LogLevel.TRACE)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.TRACE,
      message,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino.trace(entry);
    this.addToBuffer(entry);
  }

  /**
   * Logs a debug-level diagnostic message.
   *
   * @param message - Debug message string.
   * @param context - Optional contextual data.
   * @param metadata - Optional key-value metadata record.
   */
  debug(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled || !this.shouldSample(LogLevel.DEBUG)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino.debug(entry);
    this.addToBuffer(entry);
  }

  /**
   * Logs an informational message.
   *
   * @param message - Informational message string.
   * @param context - Optional contextual data.
   * @param metadata - Optional key-value metadata record.
   */
  info(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info" as LogLevel,
      message,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino.info(entry);
    this.addToBuffer(entry);
  }

  /**
   * Logs a warning message.
   *
   * @param message - Warning message string.
   * @param context - Optional contextual data.
   * @param metadata - Optional key-value metadata record.
   */
  warn(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn" as LogLevel,
      message,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino.warn(entry);
    this.addToBuffer(entry);
  }

  /**
   * Logs an error message and extracts error details including stack traces.
   *
   * @param message - Error description message.
   * @param error - The caught error object or value.
   * @param context - Optional contextual data.
   * @param metadata - Optional key-value metadata record.
   */
  error(
    message: string,
    error?: unknown,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const errorDetails = error ? formatError(error) : undefined;

    const entry: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: "error" as LogLevel,
      message,
      errorName: errorDetails?.name || "Error",
      errorMessage: errorDetails?.message || message,
      stack: errorDetails?.stack,
      context: this.enrichContext(context),
      metadata: {
        ...metadata,
        ...errorDetails,
      },
    };

    this.pino.error(entry);
    this.addToBuffer(entry);
  }

  /**
   * Logs a fatal application error and immediately attempts to flush the log buffer.
   *
   * @param message - Fatal error description message.
   * @param error - The fatal error object or value.
   * @param context - Optional contextual data.
   * @param metadata - Optional key-value metadata record.
   */
  fatal(
    message: string,
    error?: unknown,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const errorDetails = error ? formatError(error) : undefined;

    const entry: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: "fatal" as LogLevel,
      message,
      errorName: errorDetails?.name || "FatalError",
      errorMessage: errorDetails?.message || message,
      stack: errorDetails?.stack,
      context: this.enrichContext(context),
      metadata: {
        ...metadata,
        ...errorDetails,
      },
    };

    this.pino.fatal(entry);
    this.addToBuffer(entry);

    this.flush();
  }

  /**
   * Convenience helper to log an error with formatted error name and message.
   *
   * @param error - The caught error object or value.
   * @param context - Optional contextual data.
   */
  logError(error: unknown, context?: LogContext): void {
    const errorDetails = formatError(error);

    this.error(
      errorDetails.message,
      error,
      {
        ...context,
        component: context?.component || "unknown",
      },
      {
        errorType: errorDetails.name,
      },
    );
  }

  /**
   * Logs a user interaction or event for analytical tracking.
   *
   * @param actionType - Identifier describing the user action.
   * @param metadata - Optional metadata details describing the action.
   * @param context - Optional contextual data.
   */
  logUserAction(
    actionType: string,
    metadata?: Record<string, unknown>,
    context?: LogContext,
  ): void {
    if (!this.enabled) return;

    const entry: UserActionLog = {
      timestamp: new Date().toISOString(),
      level: "info" as LogLevel,
      message: `User action: ${actionType}`,
      actionType,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino.info(entry);
    this.addToBuffer(entry);
  }

  /**
   * Logs performance timing metrics, categorizing severity based on configured duration thresholds.
   *
   * @param metricName - Name or identifier of the performance metric.
   * @param value - Measured numeric value (typically duration in milliseconds).
   * @param metadata - Optional metadata describing the measurement.
   * @param context - Optional contextual data.
   */
  logPerformance(
    metricName: string,
    value: number,
    metadata?: Record<string, unknown>,
    context?: LogContext,
  ): void {
    if (!this.enabled) return;

    const unit = typeof metadata?.unit === "string" ? metadata.unit : "ms";
    const unitSuffix = unit === "ms" ? "ms" : "";

    let level: LogLevel = "debug" as LogLevel;
    let message = `Performance: ${metricName} = ${value}${unitSuffix}`;

    if (unit === "ms") {
      if (value > PERFORMANCE_THRESHOLDS.critical) {
        level = "error" as LogLevel;
        message = `Critical performance issue: ${metricName} = ${value}ms`;
      } else if (value > PERFORMANCE_THRESHOLDS.slow) {
        level = "warn" as LogLevel;
        message = `Slow performance: ${metricName} = ${value}ms`;
      }
    }

    const entry: PerformanceLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metricName,
      value,
      unit: "ms",
      context: this.enrichContext(context),
      metadata,
    };

    this.pino[level](
      { metricName, value, unit: "ms", ...context, ...metadata },
      message,
    );
    this.addToBuffer(entry);
  }

  /**
   * Logs a security-related event with an assigned threat level classification.
   *
   * @param eventType - Identifier describing the security event.
   * @param threatLevel - Threat severity classification ('low', 'medium', 'high', or 'critical').
   * @param metadata - Optional metadata details describing the security event.
   * @param context - Optional contextual data.
   */
  logSecurityEvent(
    eventType: string,
    threatLevel: "low" | "medium" | "high" | "critical",
    metadata?: Record<string, unknown>,
    context?: LogContext,
  ): void {
    if (!this.enabled) return;

    const levelMap = {
      low: "info" as LogLevel,
      medium: "warn" as LogLevel,
      high: "error" as LogLevel,
      critical: "fatal" as LogLevel,
    };

    const level = levelMap[threatLevel];

    const entry: SecurityLog = {
      timestamp: new Date().toISOString(),
      level,
      message: `Security event: ${eventType}`,
      eventType,
      threatLevel,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino[level](entry);
    this.addToBuffer(entry);

    if (threatLevel === "high" || threatLevel === "critical") {
      this.flush();
    }
  }

  /**
   * Logs HTTP API request results including method, URL, status code, and round-trip duration.
   *
   * @param method - HTTP request method (GET, POST, etc.).
   * @param url - Requested endpoint URL.
   * @param statusCode - HTTP response status code.
   * @param duration - Elapsed request duration in milliseconds.
   * @param metadata - Optional metadata associated with the API call.
   * @param context - Optional contextual data.
   */
  logApiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, unknown>,
    context?: LogContext,
  ): void {
    if (!this.enabled) return;

    const level =
      statusCode >= 500
        ? ("error" as LogLevel)
        : statusCode >= 400
          ? ("warn" as LogLevel)
          : ("debug" as LogLevel);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `API ${method} ${url} - ${statusCode} (${duration}ms)`,
      context: this.enrichContext(context),
      metadata: {
        ...metadata,
        method,
        url,
        statusCode,
        duration,
      },
    };

    this.pino[level](entry);
    this.addToBuffer(entry);
  }
}

/**
 * Default singleton instance of the ClientLogger.
 */
const clientLogger = new ClientLogger();

export default clientLogger;
export { ClientLogger };
