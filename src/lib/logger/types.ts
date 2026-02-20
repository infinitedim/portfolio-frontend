

export enum LogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface LogContext {
  
  requestId?: string;
  
  userId?: string;
  
  sessionId?: string;
  
  component?: string;
  
  action?: string;
  
  url?: string;
  
  userAgent?: string;
  
  deviceType?: string;
  
  [key: string]: unknown;
}

export interface LogEntry {
  
  timestamp: string;
  
  level: LogLevel;
  
  message: string;
  
  context?: LogContext;
  
  metadata?: Record<string, unknown>;
}

export interface ErrorLog extends LogEntry {
  
  errorName: string;
  
  errorMessage: string;
  
  stack?: string;
  
  errorCode?: string;
  
  statusCode?: number;
  
  recoveryStrategy?: string;
}

export interface PerformanceLog extends LogEntry {
  
  metricName: string;
  
  value: number;
  
  unit?: string;
  
  percentile?: number;
}

export interface UserActionLog extends LogEntry {
  
  actionType: string;
  
  target?: string;
  
  result?: string;
  
  duration?: number;
}

export interface SecurityLog extends LogEntry {
  
  eventType: string;
  
  ipAddress?: string;
  
  threatLevel?: "low" | "medium" | "high" | "critical";
  
  actionTaken?: string;
}

export interface HttpLog extends LogEntry {
  
  method: string;
  
  path: string;
  
  statusCode: number;
  
  responseTime: number;
  
  requestSize?: number;
  
  responseSize?: number;
  
  queryParams?: Record<string, unknown>;
  
  headers?: Record<string, string>;
}

export interface BatchConfig {
  
  maxBatchSize: number;
  
  maxBatchWait: number;
  
  maxRetries: number;
  
  retryDelay: number;
}

export interface LoggerConfig {
  
  level: LogLevel;
  
  pretty: boolean;
  
  environment: "development" | "staging" | "production";
  
  console: boolean;
  
  file: boolean;
  
  remote: boolean;
  
  batch?: BatchConfig;
  
  apiEndpoint?: string;
  
  maskPII: boolean;
}

export interface LogTransport {
  
  name: string;
  
  log: (entry: LogEntry) => void | Promise<void>;
  
  flush?: () => void | Promise<void>;
  
  close?: () => void | Promise<void>;
}
