

export { default as clientLogger, ClientLogger } from "./client-logger";

export {
  default as serverLogger,
  createServerLogger,
  ServerLogger,
} from "./server-logger";

export {
  initWebVitals,
  reportWebVitals,
  getWebVitalsSummary,
} from "./web-vitals";

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

export {
  clientConfig,
  serverConfig,
  PII_PATTERNS,
  SENSITIVE_HEADERS,
  SENSITIVE_FIELDS,
} from "./config";

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
