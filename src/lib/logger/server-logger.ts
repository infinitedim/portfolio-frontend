/**
 * Server-Side Logger
 * Server logging for Next.js SSR, API routes, and server components
 */

import pino from "pino";
import type { Logger as PinoLogger } from "pino";
import {
  writeFileSync,
  appendFileSync,
  existsSync,
  mkdirSync,
  statSync,
  renameSync,
} from "fs";
import { dirname } from "path";
import { serverConfig, LOG_PATHS, ROTATION_CONFIG } from "./config";
import { formatError, sanitizeHeaders, isServer } from "./utils";
import type { LogLevel, LogEntry, LogContext, HttpLog } from "./types";

/**
 * File transport for logging
 */
class FileTransport {
  private filePath: string;
  private maxSize: number;
  private maxFiles: number;
  private compress: boolean;

  constructor(filePath: string, config = ROTATION_CONFIG) {
    this.filePath = filePath;
    this.maxSize = this.parseSize(config.maxSize);
    this.maxFiles = config.maxFiles;
    this.compress = config.compress;

    // Ensure directory exists
    this.ensureDirectory();
  }

  /**
   * Parse size string to bytes
   */
  private parseSize(size: string): number {
    const units: Record<string, number> = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)([bkmg])?$/);
    if (!match) {
      return 50 * 1024 * 1024; // Default 50MB
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || "b";
    return value * units[unit];
  }

  /**
   * Ensure log directory exists
   */
  private ensureDirectory(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Check if file needs rotation
   */
  private needsRotation(): boolean {
    if (!existsSync(this.filePath)) {
      return false;
    }

    const stats = statSync(this.filePath);
    return stats.size >= this.maxSize;
  }

  /**
   * Rotate log file
   */
  private rotate(): void {
    if (!existsSync(this.filePath)) {
      return;
    }

    // Shift existing rotated files
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldFile = `${this.filePath}.${i}`;
      const newFile = `${this.filePath}.${i + 1}`;

      if (existsSync(oldFile)) {
        if (i === this.maxFiles - 1) {
          // Delete oldest file
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require("fs").unlinkSync(oldFile);
          } catch (error) {
            console.error("Failed to delete old log file:", error);
          }
        } else {
          try {
            renameSync(oldFile, newFile);
          } catch (error) {
            console.error("Failed to rotate log file:", error);
          }
        }
      }
    }

    // Rename current file
    try {
      renameSync(this.filePath, `${this.filePath}.1`);
    } catch (error) {
      console.error("Failed to rotate current log file:", error);
    }

    // TODO: Implement compression if needed
    // if (this.compress) {
    //   compressFile(`${this.filePath}.1`);
    // }
  }

  /**
   * Write log entry to file
   */
  write(entry: LogEntry): void {
    try {
      // Check if rotation is needed
      if (this.needsRotation()) {
        this.rotate();
      }

      // Write log entry
      const logLine = JSON.stringify(entry) + "\n";

      if (!existsSync(this.filePath)) {
        writeFileSync(this.filePath, logLine, "utf8");
      } else {
        appendFileSync(this.filePath, logLine, "utf8");
      }
    } catch (error) {
      console.error("Failed to write log to file:", error);
    }
  }
}

/**
 * Server Logger Class
 */
class ServerLogger {
  private pino: PinoLogger;
  private fileTransports: Map<string, FileTransport>;
  private enabled: boolean;

  constructor() {
    // Only enable on server side
    if (!isServer()) {
      this.enabled = false;
      this.pino = {} as PinoLogger;
      this.fileTransports = new Map();
      return;
    }

    this.enabled = true;
    this.fileTransports = new Map();

    // Initialize file transports if file logging is enabled
    if (serverConfig.file) {
      try {
        this.fileTransports.set(
          "combined",
          new FileTransport(LOG_PATHS.combined),
        );
        this.fileTransports.set("error", new FileTransport(LOG_PATHS.error));
        this.fileTransports.set("access", new FileTransport(LOG_PATHS.access));
      } catch (error) {
        console.error("Failed to initialize file transports:", error);
      }
    }

    // Initialize Pino with server configuration
    this.pino = pino({
      level: serverConfig.level,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      ...(serverConfig.pretty && {
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
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ServerLogger {
    const childLogger = new ServerLogger();
    childLogger.pino = this.pino.child(context);
    childLogger.fileTransports = this.fileTransports;
    return childLogger;
  }

  /**
   * Write to file transports
   */
  private writeToFile(entry: LogEntry): void {
    if (!serverConfig.file || !this.enabled) {
      return;
    }

    // Write to combined log
    const combinedTransport = this.fileTransports.get("combined");
    if (combinedTransport) {
      combinedTransport.write(entry);
    }

    // Write errors to error log
    if (entry.level === "error" || entry.level === "fatal") {
      const errorTransport = this.fileTransports.get("error");
      if (errorTransport) {
        errorTransport.write(entry);
      }
    }
  }

  /**
   * Write HTTP logs to access log
   */
  private writeToAccessLog(entry: HttpLog): void {
    if (!serverConfig.file || !this.enabled) {
      return;
    }

    const accessTransport = this.fileTransports.get("access");
    if (accessTransport) {
      accessTransport.write(entry);
    }
  }

  /**
   * Enrich log entry with context
   */
  private enrichContext(context?: LogContext): LogContext {
    return {
      environment: serverConfig.environment,
      hostname: process.env.HOSTNAME || "unknown",
      ...context,
    };
  }

  /**
   * Log a trace message
   */
  trace(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "trace" as LogLevel,
      message,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino.trace(entry);
    this.writeToFile(entry);
  }

  /**
   * Log a debug message
   */
  debug(
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "debug" as LogLevel,
      message,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino.debug(entry);
    this.writeToFile(entry);
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
    this.writeToFile(entry);
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
    this.writeToFile(entry);
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

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error" as LogLevel,
      message,
      context: this.enrichContext(context),
      metadata: {
        ...metadata,
        ...errorDetails,
      },
    };

    this.pino.error(entry);
    this.writeToFile(entry);
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

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "fatal" as LogLevel,
      message,
      context: this.enrichContext(context),
      metadata: {
        ...metadata,
        ...errorDetails,
      },
    };

    this.pino.fatal(entry);
    this.writeToFile(entry);
  }

  /**
   * Log an HTTP request/response
   */
  logHttp(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const level =
      statusCode >= 500
        ? ("error" as LogLevel)
        : statusCode >= 400
          ? ("warn" as LogLevel)
          : ("info" as LogLevel);

    const entry: HttpLog = {
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${path} ${statusCode} - ${responseTime}ms`,
      method,
      path,
      statusCode,
      responseTime,
      context: this.enrichContext(context),
      metadata,
    };

    this.pino[level](entry);
    this.writeToFile(entry);
    this.writeToAccessLog(entry);
  }

  /**
   * Log an HTTP request with full details
   */
  logRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const sanitized = sanitizeHeaders(headers);

    this.debug(`Incoming request: ${method} ${url}`, context, {
      ...metadata,
      method,
      url,
      headers: sanitized,
    });
  }

  /**
   * Log an HTTP response
   */
  logResponse(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
    metadata?: Record<string, unknown>,
  ): void {
    this.logHttp(method, url, statusCode, responseTime, context, metadata);
  }

  /**
   * Log client logs received from frontend
   */
  logClientLogs(logs: LogEntry[], clientInfo?: Record<string, unknown>): void {
    if (!this.enabled) return;

    for (const log of logs) {
      const entry: LogEntry = {
        ...log,
        context: {
          ...log.context,
          source: "client",
          ...clientInfo,
        },
      };

      // Use appropriate log level
      const level = entry.level || "info";
      const logMethod = this.pino[level] as (obj: unknown) => void;

      if (logMethod) {
        logMethod.call(this.pino, entry);
        this.writeToFile(entry);
      }
    }
  }
}

// Export factory function to create logger instances
export function createServerLogger(component?: string): ServerLogger {
  const logger = new ServerLogger();
  return component ? logger.child({ component }) : logger;
}

// Export singleton instance
const serverLogger = new ServerLogger();

export default serverLogger;
export { ServerLogger };
