

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

interface LogBuffer {
  logs: LogEntry[];
  timer: NodeJS.Timeout | null;
  retryCount: number;
}

class ClientLogger {
  private pino: PinoLogger;
  private buffer: LogBuffer;
  private config: BatchConfig;
  private enabled: boolean;

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

  

  child(context: LogContext): ClientLogger {
    const childLogger = Object.create(this) as ClientLogger;
    childLogger.pino = this.pino.child(context);
    return childLogger;
  }

  

  private shouldSample(level: LogLevel): boolean {
    const rate = SAMPLING_CONFIG[level as keyof typeof SAMPLING_CONFIG] || 1.0;
    return Math.random() < rate;
  }

  

  private enrichContext(context?: LogContext): LogContext {
    const requestContext = getRequestContext();
    return {
      ...requestContext,
      ...context,
    };
  }

  

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

  

  logPerformance(
    metricName: string,
    value: number,
    metadata?: Record<string, unknown>,
    context?: LogContext,
  ): void {
    if (!this.enabled) return;

    
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

const clientLogger = new ClientLogger();

export default clientLogger;
export { ClientLogger };
