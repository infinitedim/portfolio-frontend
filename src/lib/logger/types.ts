/**
 * Logging Types and Interfaces
 * Defines all types used across the logging system
 */

/**
 * Log severity levels
 */
export enum LogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

/**
 * Context information for log entries
 */
export interface LogContext {
  /** Unique request/correlation ID for tracing across services */
  requestId?: string;
  /** User identifier (if authenticated) */
  userId?: string;
  /** Session identifier */
  sessionId?: string;
  /** Component or module name where log originated */
  component?: string;
  /** Action being performed */
  action?: string;
  /** Page URL or route */
  url?: string;
  /** User agent string */
  userAgent?: string;
  /** Device type (mobile, tablet, desktop) */
  deviceType?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Base log entry structure
 */
export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Context information */
  context?: LogContext;
  /** Additional structured metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error-specific log entry
 */
export interface ErrorLog extends LogEntry {
  /** Error name/type */
  errorName: string;
  /** Error message */
  errorMessage: string;
  /** Stack trace */
  stack?: string;
  /** Error code (if applicable) */
  errorCode?: string;
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Recovery strategy attempted */
  recoveryStrategy?: string;
}

/**
 * Performance metric log entry
 */
export interface PerformanceLog extends LogEntry {
  /** Metric name (e.g., "LCP", "FID", "response_time") */
  metricName: string;
  /** Metric value */
  value: number;
  /** Unit of measurement (ms, bytes, etc.) */
  unit?: string;
  /** Percentile (if applicable) */
  percentile?: number;
}

/**
 * User action log entry
 */
export interface UserActionLog extends LogEntry {
  /** Action type (click, submit, navigate, etc.) */
  actionType: string;
  /** Target element or component */
  target?: string;
  /** Action result (success, failure) */
  result?: string;
  /** Duration in milliseconds */
  duration?: number;
}

/**
 * Security event log entry
 */
export interface SecurityLog extends LogEntry {
  /** Event type (auth_failure, suspicious_activity, etc.) */
  eventType: string;
  /** IP address */
  ipAddress?: string;
  /** Threat level */
  threatLevel?: "low" | "medium" | "high" | "critical";
  /** Action taken */
  actionTaken?: string;
}

/**
 * HTTP request/response log entry
 */
export interface HttpLog extends LogEntry {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Status code */
  statusCode: number;
  /** Response time in milliseconds */
  responseTime: number;
  /** Request size in bytes */
  requestSize?: number;
  /** Response size in bytes */
  responseSize?: number;
  /** Query parameters (sanitized) */
  queryParams?: Record<string, unknown>;
  /** Request headers (sanitized) */
  headers?: Record<string, string>;
}

/**
 * Configuration for log batching
 */
export interface BatchConfig {
  /** Maximum number of logs to batch before sending */
  maxBatchSize: number;
  /** Maximum time to wait before sending batch (ms) */
  maxBatchWait: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Base retry delay (ms) */
  retryDelay: number;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to process */
  level: LogLevel;
  /** Enable pretty printing (development) */
  pretty: boolean;
  /** Environment (development, staging, production) */
  environment: "development" | "staging" | "production";
  /** Enable console output */
  console: boolean;
  /** Enable file output */
  file: boolean;
  /** Enable remote logging */
  remote: boolean;
  /** Batch configuration for remote logging */
  batch?: BatchConfig;
  /** Backend API endpoint for log forwarding */
  apiEndpoint?: string;
  /** Enable PII masking */
  maskPII: boolean;
}

/**
 * Log transport interface
 */
export interface LogTransport {
  /** Transport name */
  name: string;
  /** Log a message */
  log: (entry: LogEntry) => void | Promise<void>;
  /** Flush pending logs */
  flush?: () => void | Promise<void>;
  /** Close the transport */
  close?: () => void | Promise<void>;
}
