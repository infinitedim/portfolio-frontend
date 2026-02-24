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

    this.ensureDirectory();
  }

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

  private ensureDirectory(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private needsRotation(): boolean {
    if (!existsSync(this.filePath)) {
      return false;
    }

    const stats = statSync(this.filePath);
    return stats.size >= this.maxSize;
  }

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

    try {
      renameSync(this.filePath, `${this.filePath}.1`);
    } catch (error) {
      console.error("Failed to rotate current log file:", error);
    }
  }

  write(entry: LogEntry): void {
    try {
      if (this.needsRotation()) {
        this.rotate();
      }

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

class ServerLogger {
  private pino: PinoLogger;
  private fileTransports: Map<string, FileTransport>;
  private enabled: boolean;

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

  child(context: LogContext): ServerLogger {
    const childLogger = new ServerLogger();
    // When running outside a server environment (e.g., bun test with jsdom),
    // this.pino is an empty object stub — guard against missing child method.
    if (typeof this.pino.child === "function") {
      childLogger.pino = this.pino.child(context);
    } else {
      childLogger.pino = this.pino;
    }
    childLogger.fileTransports = this.fileTransports;
    return childLogger;
  }

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

  private writeToAccessLog(entry: HttpLog): void {
    if (!serverConfig.file || !this.enabled) {
      return;
    }

    const accessTransport = this.fileTransports.get("access");
    if (accessTransport) {
      accessTransport.write(entry);
    }
  }

  private enrichContext(context?: LogContext): LogContext {
    return {
      environment: serverConfig.environment,
      hostname: process.env.HOSTNAME || "unknown",
      ...context,
    };
  }

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

export function createServerLogger(component?: string): ServerLogger {
  const logger = new ServerLogger();
  return component ? logger.child({ component }) : logger;
}

const serverLogger = new ServerLogger();

export default serverLogger;
export { ServerLogger };
