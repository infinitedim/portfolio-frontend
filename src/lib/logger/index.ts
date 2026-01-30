/**
 * Logger Module Exports
 * Centralized exports for the logging system
 */

// Client logger
export { default as clientLogger, ClientLogger } from "./client-logger";

// Server logger
export { default as serverLogger, createServerLogger, ServerLogger } from "./server-logger";

// Web Vitals
export { initWebVitals, reportWebVitals, getWebVitalsSummary } from "./web-vitals";

// Types
export type {
  LogContext,
  LogEntry,
  ErrorLog,
  PerformanceLog,
  UserActionLog,
  SecurityLog,
  HttpLog,
  BatchConfig,
  LoggerConfig,
  LogTransport,
} from "./types";

export { LogLevel } from "./types";

// Configuration
export { clientConfig, serverConfig, PII_PATTERNS, SENSITIVE_HEADERS, SENSITIVE_FIELDS } from "./config";

// Utilities
export {
  maskPII,
  maskPIIString,
  sanitizeHeaders,
  formatError,
  getRequestContext,
  generateCorrelationId,
  isClient,
  isServer,
  safeStringify,
  truncate,
  getObjectSize,
} from "./utils";
