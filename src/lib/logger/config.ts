/**
 * Logging Configuration
 * Environment-based configuration for the logging system
 */

import { LogLevel, type LoggerConfig, type BatchConfig } from "./types";

/**
 * Get the current environment
 */
function getEnvironment(): "development" | "staging" | "production" {
  const env = process.env.NODE_ENV as string | undefined;
  if (env === "production") return "production";
  if (env === "staging") return "staging";
  return "development";
}

/**
 * Default batch configuration
 */
const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 10,
  maxBatchWait: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Get log level based on environment
 */
function getLogLevel(): LogLevel {
  const env = getEnvironment();

  // Allow override via environment variable
  const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase();
  if (envLogLevel && Object.values(LogLevel).includes(envLogLevel as LogLevel)) {
    return envLogLevel as LogLevel;
  }

  // Default log levels per environment
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
 * Get backend API endpoint
 */
function getApiEndpoint(): string {
  // Check for logging-specific endpoint first
  if (process.env.NEXT_PUBLIC_LOG_API_URL) {
    return process.env.NEXT_PUBLIC_LOG_API_URL;
  }

  // Fall back to general API URL with /logs path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (baseUrl) {
    return `${baseUrl}/api/logs`;
  }

  // Default to same-origin API route
  return "/api/logs";
}

/**
 * Client-side logger configuration
 */
export const clientConfig: LoggerConfig = {
  level: getLogLevel(),
  pretty: getEnvironment() === "development",
  environment: getEnvironment(),
  console: true,
  file: false, // Browsers can't write to files
  remote: getEnvironment() !== "development", // Send to backend in staging/prod
  batch: DEFAULT_BATCH_CONFIG,
  apiEndpoint: getApiEndpoint(),
  maskPII: true, // Always mask PII in client logs
};

/**
 * Server-side logger configuration
 */
export const serverConfig: LoggerConfig = {
  level: getLogLevel(),
  pretty: getEnvironment() === "development",
  environment: getEnvironment(),
  console: true,
  file: getEnvironment() !== "development", // Write to files in staging/prod
  remote: false, // Server logs go directly to files
  maskPII: true,
};

/**
 * PII masking patterns
 */
export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
} as const;

/**
 * Sensitive header names to exclude from logs
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
 * Sensitive field names to mask in objects
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
 * Log file paths (server-side only)
 */
export const LOG_PATHS = {
  combined: "logs/server/combined.log",
  error: "logs/server/error.log",
  access: "logs/server/access.log",
} as const;

/**
 * Log rotation configuration (server-side)
 */
export const ROTATION_CONFIG = {
  maxSize: "50m", // 50MB
  maxFiles: 10,
  compress: true,
} as const;

/**
 * Sampling configuration for high-volume logs
 */
export const SAMPLING_CONFIG = {
  // Sample 10% of debug logs in production
  debug: getEnvironment() === "production" ? 0.1 : 1.0,
  // Sample 100% of info and above
  info: 1.0,
  warn: 1.0,
  error: 1.0,
  fatal: 1.0,
} as const;

/**
 * Performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  slow: 1000, // Log warning if response takes > 1s
  critical: 5000, // Log error if response takes > 5s
} as const;
