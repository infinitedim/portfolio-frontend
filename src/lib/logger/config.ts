

import { LogLevel, type LoggerConfig, type BatchConfig } from "./types";

function getEnvironment(): "development" | "staging" | "production" {
  const env = process.env.NODE_ENV;
  if (env === "production") return "production";
  if (env === "test") return "staging";
  return "development";
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 10,
  maxBatchWait: 5000, 
  maxRetries: 3,
  retryDelay: 1000, 
};

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

export const serverConfig: LoggerConfig = {
  level: getLogLevel(),
  pretty: getEnvironment() === "development",
  environment: getEnvironment(),
  console: true,
  file: getEnvironment() !== "development", 
  remote: false, 
  maskPII: true,
};

export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone:
    /\b(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
} as const;

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

export const LOG_PATHS = {
  combined: "logs/server/combined.log",
  error: "logs/server/error.log",
  access: "logs/server/access.log",
} as const;

export const ROTATION_CONFIG = {
  maxSize: "50m", 
  maxFiles: 10,
  compress: true,
} as const;

export const SAMPLING_CONFIG = {
  
  debug: getEnvironment() === "production" ? 0.1 : 1.0,
  
  info: 1.0,
  warn: 1.0,
  error: 1.0,
  fatal: 1.0,
} as const;

export const PERFORMANCE_THRESHOLDS = {
  slow: 1000, 
  critical: 5000, 
} as const;
