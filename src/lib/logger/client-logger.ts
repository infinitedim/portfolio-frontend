/**
 * Client-Side Logger
 * Browser logging with Pino, batching, and backend forwarding
 */

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
 * Log buffer for batching
 */
interface LogBuffer {
  logs: LogEntry[];
  timer: NodeJS.Timeout | null;
  retryCount: number;
}

/**
 * Client Logger Class
 */
class ClientLogger {
  private pino: PinoLogger;
  private buffer: LogBuffer;
  private config: BatchConfig;
  private enabled: boolean;

  constructor() {
    // Check if running on client side
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

    // Initialize Pino with browser configuration
    this.pino = pino({
      level: clientConfig.level,
      browser: {
        asObject: true,
        serialize: true,
      },
      ...(clientConfig.pretty && {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
    });

    // Initialize buffer
    this.buffer = {
      logs: [],
      timer: null,
      retryCount: 0,
    };

    // Flush logs before page unload
    if (
      typeof window !== "undefined" &&
      typeof window.addEventListener === "function"
    ) {
      window.addEventListener("beforeunload", () => {
        this.flush();
      });

      // Also flush on visibility change (when tab is hidden)
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
   * Create a child logger with additional context.
   * Reuses the parent's buffer and event listeners instead of constructing a
   * brand-new ClientLogger (which would attach duplicate `beforeunload` /
   * `visibilitychange` listeners on every call).
   */
  child(context: LogContext): ClientLogger {
    const childLogger = Object.create(this) as ClientLogger;
    childLogger.pino = this.pino.child(context);
    return childLogger;
  }

  /**
   * Check if log should be sampled
   */
  private shouldSample(level: LogLevel): boolean {
    const rate = SAMPLING_CONFIG[level as keyof typeof SAMPLING_CONFIG] || 1.0;
    return Math.random() < rate;
  }

  /**
   * Enrich log entry with context
   */
  private enrichContext(context?: LogContext): LogContext {
    const requestContext = getRequestContext();
    return {
      ...requestContext,
      ...context,
    };
  }

  /**
   * Add log to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    if (!clientConfig.remote || !this.enabled) {
      return;
    }

    // Mask PII before adding to buffer
    const maskedEntry = clientConfig.maskPII
      ? {
          ...entry,
          metadata: maskPII(entry.metadata) as Record<string, unknown>,
        }
      : entry;

    this.buffer.logs.push(maskedEntry);

    // Send immediately if buffer is full
    if (this.buffer.logs.length >= this.config.maxBatchSize) {
      this.flush();
      return;
    }

    // Set timer to send after max wait time
    if (!this.buffer.timer) {
      this.buffer.timer = setTimeout(() => {
        this.flush();
      }, this.config.maxBatchWait);
    }
  }

  /**
   * Flush buffered logs to backend
   */
  async flush(): Promise<void> {
    if (!this.enabled || this.buffer.logs.length === 0) {
      return;
    }

    // Clear timer
    if (this.buffer.timer) {
      clearTimeout(this.buffer.timer);
      this.buffer.timer = null;
    }

    // Get logs to send
    const logsToSend = [...this.buffer.logs];
    this.buffer.logs = [];

    try {
      const response = await fetch(clientConfig.apiEndpoint || "/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: logsToSend }),
        // Use sendBeacon fallback for beforeunload
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status}`);
      }

      // Reset retry count on success
      this.buffer.retryCount = 0;
    } catch (error) {
      // Retry with exponential backoff
      this.buffer.retryCount++;

      if (this.buffer.retryCount <= this.config.maxRetries) {
        const delay =
          this.config.retryDelay * Math.pow(2, this.buffer.retryCount - 1);

        console.warn(`Failed to send logs, retrying in ${delay}ms...`, error);

        // Add logs back to buffer
        this.buffer.logs.unshift(...logsToSend);

        // Retry after delay
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
   * Log a trace message
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
   * Log a debug message
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
   * Log an info message
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
   * Log a warning message
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
   * Log an error
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
   * Log a fatal error
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

    // Flush immediately for fatal errors
    this.flush();
  }

  /**
   * Log an error with enhanced error tracking
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
   * Log a user action
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
   * Log a performance metric
   */
  logPerformance(
    metricName: string,
    value: number,
    metadata?: Record<string, unknown>,
    context?: LogContext,
  ): void {
    if (!this.enabled) return;

    // Determine log level based on performance thresholds
    let level: LogLevel = "debug" as LogLevel;
    let message = `Performance: ${metricName} = ${value}ms`;

    if (value > PERFORMANCE_THRESHOLDS.critical) {
      level = "error" as LogLevel;
      message = `Critical performance issue: ${metricName} = ${value}ms`;
    } else if (value > PERFORMANCE_THRESHOLDS.slow) {
      level = "warn" as LogLevel;
      message = `Slow performance: ${metricName} = ${value}ms`;
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

    this.pino[level](entry);
    this.addToBuffer(entry);
  }

  /**
   * Log a security event
   */
  logSecurityEvent(
    eventType: string,
    threatLevel: "low" | "medium" | "high" | "critical",
    metadata?: Record<string, unknown>,
    context?: LogContext,
  ): void {
    if (!this.enabled) return;

    // Map threat level to log level
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

    // Flush immediately for high/critical security events
    if (threatLevel === "high" || threatLevel === "critical") {
      this.flush();
    }
  }

  /**
   * Log an API request/response
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

// Export singleton instance
const clientLogger = new ClientLogger();

export default clientLogger;
export { ClientLogger };
