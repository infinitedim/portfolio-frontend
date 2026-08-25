import { LogLevel, type LoggerConfig, type BatchConfig } from "./types";

/**
 * Resolves the runtime environment name from `NODE_ENV`.
 *
 * @returns Standardized environment name ('development', 'staging', or 'production').
 */
function getEnvironment(): "development" | "staging" | "production" {
  const env = process.env.NODE_ENV;
  if (env === "production") return "production";
  if (env === "test") return "staging";
  return "development";
}

/**
 * Default batch configuration parameters for client-side log buffering and dispatch.
 */
const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 10,
  maxBatchWait: 5000,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Resolves the active log level from environment variables or default environment mappings.
 *
 * @returns Configured LogLevel enum member.
 */
function getLogLevel(): LogLevel {
  const env = getEnvironment();

  const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase();
  if (
    envLogLevel &&
    Object.values(LogLevel).includes(envLogLevel as LogLevel)
  ) {
    return envLogLevel as LogLevel;
  }

  switch (env) {
    case "production":
      return LogLevel.INFO;
    case "staging":
      return LogLevel.DEBUG;
    case "development":
      return LogLevel.TRACE;
    default:
      return LogLevel.INFO;
  }
}

/**
 * Resolves the HTTP endpoint URL for submitting client log batches.
 *
 * @returns Full or relative API endpoint URL string.
 */
function getApiEndpoint(): string {
  if (process.env.NEXT_PUBLIC_LOG_API_URL) {
    return process.env.NEXT_PUBLIC_LOG_API_URL;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (baseUrl) {
    return `${baseUrl}/api/logs`;
  }

  return "/api/logs";
}

/**
 * Global configuration settings for client-side logging.
 */
export const clientConfig: LoggerConfig = {
  level: getLogLevel(),
  pretty: getEnvironment() === "development",
  environment: getEnvironment(),
  console: true,
  file: false,
  remote: getEnvironment() !== "development",
  batch: DEFAULT_BATCH_CONFIG,
  apiEndpoint: getApiEndpoint(),
  maskPII: true,
};

/**
 * Determines whether server-side log output should be written to local filesystem log files.
 *
 * @returns True if file logging is enabled and runtime permits file writes; otherwise false.
 */
function shouldEnableFileLogging(): boolean {
  if (getEnvironment() === "development") {
    return false;
  }

  if (process.env.VERCEL === "1") {
    return false;
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return false;
  }
  return process.env.LOG_TO_FILE === "true";
}

/**
 * Global configuration settings for server-side logging.
 */
export const serverConfig: LoggerConfig = {
  level: getLogLevel(),
  pretty: getEnvironment() === "development",
  environment: getEnvironment(),
  console: true,
  file: shouldEnableFileLogging(),
  remote: false,
  maskPII: true,
};

/**
 * Regular expression patterns used for identifying and masking personally identifiable information (PII).
 */
export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone:
    /\b(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
} as const;

/**
 * HTTP request header names that may contain sensitive credentials and must be redacted in logs.
 */
export const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
  "x-csrf-token",
  "x-session-token",
  "password",
  "secret",
  "token",
] as const;

/**
 * Object property keys that contain sensitive information and must be redacted in logs.
 */
export const SENSITIVE_FIELDS = [
  "password",
  "passwordConfirm",
  "currentPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "secretKey",
  "privateKey",
  "creditCard",
  "cvv",
  "ssn",
  "socialSecurityNumber",
] as const;

/**
 * Relative filesystem target paths for categorized server log files.
 */
export const LOG_PATHS = {
  combined: "logs/server/combined.log",
  error: "logs/server/error.log",
  access: "logs/server/access.log",
} as const;

/**
 * Log rotation parameters controlling file sizes, retention counts, and gzip compression.
 */
export const ROTATION_CONFIG = {
  maxSize: "50m",
  maxFiles: 10,
  compress: true,
} as const;

/**
 * Log level sampling rates controlling the ratio of logs retained in production.
 */
export const SAMPLING_CONFIG = {
  debug: getEnvironment() === "production" ? 0.1 : 1.0,

  info: 1.0,
  warn: 1.0,
  error: 1.0,
  fatal: 1.0,
} as const;

/**
 * Duration thresholds in milliseconds for classifying slow and critical performance operations.
 */
export const PERFORMANCE_THRESHOLDS = {
  slow: 1000,
  critical: 5000,
} as const;

