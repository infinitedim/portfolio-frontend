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
 * Handles synchronous/asynchronous file writing and log rotation for server logs.
 */
class FileTransport {
  /** Target log file path. */
  private filePath: string;
  /** Maximum file size in bytes before triggering rotation. */
  private maxSize: number;
  /** Maximum number of rotated archive files to retain. */
  private maxFiles: number;
  /** Flag indicating whether rotated logs should be compressed. */
  private compress: boolean;

  /**
   * Initializes a new FileTransport instance.
   *
   * @param filePath - File system path to the target log file.
   * @param config - Rotation configuration parameters.
   */
  constructor(filePath: string, config = ROTATION_CONFIG) {
    this.filePath = filePath;
    this.maxSize = this.parseSize(config.maxSize);
    this.maxFiles = config.maxFiles;
    this.compress = config.compress;

    this.ensureDirectory();
  }

  /**
   * Parses human-readable size strings (e.g. '50m', '10k', '1g') into integer bytes.
   *
   * @param size - Size specification string with optional unit suffix.
   * @returns Byte count as an integer.
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
      return 50 * 1024 * 1024;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || "b";
    return value * units[unit];
  }

  /**
   * Ensures that the parent directory path for the log file exists.
   */
  private ensureDirectory(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      try {
        mkdirSync(dir, { recursive: true });
      } // eslint-disable-next-line no-empty
    catch {}
    }
  }

  /**
   * Checks if the active log file has exceeded the configured maximum size threshold.
   *
   * @returns True if log rotation is required; otherwise false.
   */
  private needsRotation(): boolean {
    if (!existsSync(this.filePath)) {
      return false;
    }

    const stats = statSync(this.filePath);
    return stats.size >= this.maxSize;
  }

  /**
   * Rotates existing log files by shifting index extensions (e.g. .1, .2).
   */
  private rotate(): void {
    if (!existsSync(this.filePath)) {
      return;
    }

    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldFile = `${this.filePath}.${i}`;
      const newFile = `${this.filePath}.${i + 1}`;

      if (existsSync(oldFile)) {
        if (i === this.maxFiles - 1) {
          try {
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

    try {
      renameSync(this.filePath, `${this.filePath}.1`);
    } catch (error) {
      console.error("Failed to rotate current log file:", error);
    }
  }

  /**
   * Writes a single structured log entry to the log file.
   *
   * @param entry - The structured log entry to write.
   */
  write(entry: LogEntry): void {
    try {
      if (this.needsRotation()) {
        this.rotate();
      }

      const logLine = JSON.stringify(entry) + "\n";

      const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
        | {
            file: (path: string) => unknown;
            write: (
              target: unknown,
              data: string,
              options?: { append?: boolean },
            ) => Promise<number>;
          }
        | undefined;

      if (bunGlobal) {
        const file = bunGlobal.file(this.filePath);
        bunGlobal.write(file, logLine, { append: true }).catch((error: unknown) => {
          console.error("Failed to write log to file via Bun.write:", error);
        });
      } else {
        if (!existsSync(this.filePath)) {
          writeFileSync(this.filePath, logLine, "utf8");
        } else {
          appendFileSync(this.filePath, logLine, "utf8");
        }
      }
    } catch (error) {
      console.error("Failed to write log to file:", error);
    }
  }
}

/**
 * Server-side logging service wrapping Pino with optional filesystem persistence and request tracing.
 */
class ServerLogger {
  /** Underlying Pino logger instance. */
  private pino: PinoLogger;
  /** Registry of active file transports mapped by transport key. */
  private fileTransports: Map<string, FileTransport>;
  /** Indicates whether server logging is enabled in the current environment. */
  private enabled: boolean;

  /**
   * Initializes the server logger and its configured file transports.
   */
  constructor() {
    if (!isServer()) {
      this.enabled = false;
      this.pino = {} as PinoLogger;
      this.fileTransports = new Map();
      return;
    }

    this.enabled = true;
    this.fileTransports = new Map();

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
   * Creates a child logger with bound contextual metadata.
   *
   * @param context - Additional contextual properties to attach to all subsequent logs.
   * @returns A new ServerLogger instance.
   */
  child(context: LogContext): ServerLogger {
    const childLogger = new ServerLogger();

    if (typeof this.pino.child === "function") {
      childLogger.pino = this.pino.child(context);
    } else {
      childLogger.pino = this.pino;
    }
    childLogger.fileTransports = this.fileTransports;
    return childLogger;
  }

  /**
   * Writes a log entry to the combined and error file transports if enabled.
   *
   * @param entry - Structured log entry to persist.
   */
  private writeToFile(entry: LogEntry): void {
    if (!serverConfig.file || !this.enabled) {
      return;
    }

    const combinedTransport = this.fileTransports.get("combined");
    if (combinedTransport) {
      combinedTransport.write(entry);
    }

    if (entry.level === "error" || entry.level === "fatal") {
      const errorTransport = this.fileTransports.get("error");
      if (errorTransport) {
        errorTransport.write(entry);
      }
    }
  }

  /**
   * Writes an HTTP request log entry to the dedicated access log transport.
   *
   * @param entry - HTTP request log entry to persist.
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
   * Enriches contextual log properties with server environment details (hostname, environment).
   *
   * @param context - Optional caller-supplied context to merge.
   * @returns Merged contextual object.
   */
  private enrichContext(context?: LogContext): LogContext {
    return {
      environment: serverConfig.environment,
      hostname: process.env.HOSTNAME || "unknown",
      ...context,
    };
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
    this.writeToFile(entry);
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
    this.writeToFile(entry);
  }

  /**
   * Logs an error message and extracts error details.
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
   * Logs a fatal application error.
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
   * Logs an HTTP request completion event and writes to the access log.
   *
   * @param method - HTTP request method.
   * @param path - Requested URL path.
   * @param statusCode - HTTP status code.
   * @param responseTime - Response time in milliseconds.
   * @param context - Optional contextual data.
   * @param metadata - Optional metadata record.
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
   * Logs an incoming HTTP request with sanitized headers.
   *
   * @param method - HTTP request method.
   * @param url - Incoming request URL.
   * @param headers - HTTP request headers dictionary.
   * @param context - Optional contextual data.
   * @param metadata - Optional metadata record.
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
   * Logs an outgoing HTTP response with response time metrics.
   *
   * @param method - HTTP request method.
   * @param url - Target endpoint URL.
   * @param statusCode - HTTP status code.
   * @param responseTime - Response time in milliseconds.
   * @param context - Optional contextual data.
   * @param metadata - Optional metadata record.
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
   * Ingests and processes a batch of client log entries forwarded from the browser.
   *
   * @param logs - Array of client log entries.
   * @param clientInfo - Optional metadata describing the client source.
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

      const level = entry.level || "info";
      const logMethod = this.pino[level] as (obj: unknown) => void;

      if (logMethod) {
        logMethod.call(this.pino, entry);
        this.writeToFile(entry);
      }
    }
  }
}

/**
 * Factory function creating a scoped ServerLogger child instance bound to a specific component.
 *
 * @param component - Optional component or module name to bind as context.
 * @returns Scoped ServerLogger instance.
 */
export function createServerLogger(component?: string): ServerLogger {
  const logger = new ServerLogger();
  return component ? logger.child({ component }) : logger;
}

/**
 * Default singleton instance of the ServerLogger.
 */
const serverLogger = new ServerLogger();

export default serverLogger;
export { ServerLogger };
