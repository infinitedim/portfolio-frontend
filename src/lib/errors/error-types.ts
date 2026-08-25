/**
 * Enumeration representing the severity levels of an application error.
 * Used for error reporting, UI alert styling, and determining escalation urgency.
 */
export enum ErrorSeverity {
  /**
   * Low severity error that does not interrupt core user workflows.
   */
  LOW = "LOW",

  /**
   * Medium severity error affecting non-critical functionality, recoverable via fallback or retry.
   */
  MEDIUM = "MEDIUM",

  /**
   * High severity error impacting primary user flows or causing significant degradation.
   */
  HIGH = "HIGH",

  /**
   * Critical severity error indicating complete system failure, security violation, or unrecoverable crash.
   */
  CRITICAL = "CRITICAL",
}

/**
 * Categorizes errors into functional domains to simplify triaging, telemetry tracking, and targeted remediation strategies.
 */
export enum ErrorCategory {
  /**
   * Network connection issues, timeouts, or DNS failures.
   */
  NETWORK = "NETWORK",

  /**
   * Client-side or server-side schema and input validation errors.
   */
  VALIDATION = "VALIDATION",

  /**
   * Authentication failures, expired tokens, or missing session credentials.
   */
  AUTHENTICATION = "AUTHENTICATION",

  /**
   * Access control and permission violations for requested resources.
   */
  AUTHORIZATION = "AUTHORIZATION",

  /**
   * Database connectivity or transaction execution failures.
   */
  DATABASE = "DATABASE",

  /**
   * General REST/GraphQL API communication or HTTP status code failures.
   */
  API = "API",

  /**
   * React component rendering errors or client-side DOM exceptions.
   */
  UI = "UI",

  /**
   * Performance threshold violations such as slow renders or high latency.
   */
  PERFORMANCE = "PERFORMANCE",

  /**
   * Security-related violations like CSRF, CORS, or tampering attempts.
   */
  SECURITY = "SECURITY",

  /**
   * Inconsistencies with domain business rules or workflow constraints.
   */
  BUSINESS_LOGIC = "BUSINESS_LOGIC",

  /**
   * Failures originating from third-party APIs or external microservices.
   */
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",

  /**
   * Missing or invalid environment variables and application configurations.
   */
  CONFIGURATION = "CONFIGURATION",

  /**
   * Unclassified or fallback error category.
   */
  UNKNOWN = "UNKNOWN",
}

/**
 * Defines automated or suggested remediation workflows for handling encountered errors.
 */
export enum ErrorRecoveryStrategy {
  /**
   * Retry the failed operation immediately or after a backoff delay.
   */
  RETRY = "RETRY",

  /**
   * Switch to a degraded or cached fallback state.
   */
  FALLBACK = "FALLBACK",

  /**
   * Safely ignore the error and allow normal execution to proceed.
   */
  IGNORE = "IGNORE",

  /**
   * Prompt the user to modify input or trigger an action manually.
   */
  USER_ACTION = "USER_ACTION",

  /**
   * Redirect the user to a different route (e.g., login or error landing page).
   */
  REDIRECT = "REDIRECT",

  /**
   * Refresh the browser page or re-mount the active component subtree.
   */
  REFRESH = "REFRESH",

  /**
   * Terminate the user's session and clear local authentication state.
   */
  LOGOUT = "LOGOUT",

  /**
   * Escalate the issue to an administrative monitoring service or alert channel.
   */
  ESCALATE = "ESCALATE",
}

/**
 * Contextual metadata captured when an error is instantiated, aiding in debugging and audit logs.
 */
export interface ErrorContext {
  /**
   * The ID of the authenticated user when the error occurred.
   */
  userId?: string;
  /**
   * The unique session identifier of the current browsing session.
   */
  sessionId?: string;
  /**
   * The URL or route active when the error occurred.
   */
  url?: string;
  /**
   * The user agent string identifying the client's browser/environment.
   */
  userAgent?: string;
  /**
   * Timestamp recording the exact moment the error occurred.
   */
  timestamp: Date;
  /**
   * Arbitrary structured data providing additional troubleshooting context.
   */
  additionalData?: Record<string, unknown>;
}

/**
 * Comprehensive configuration options and metadata associated with an enhanced error.
 */
export interface ErrorMetadata {
  /**
   * Unique identifier for tracing this error instance across systems.
   */
  id: string;
  /**
   * Domain category of the error.
   */
  category: ErrorCategory;
  /**
   * Impact severity of the error.
   */
  severity: ErrorSeverity;
  /**
   * Flag indicating whether the operation is safe to retry.
   */
  isRetryable: boolean;
  /**
   * Maximum number of retry attempts allowed for this error.
   */
  maxRetries: number;
  /**
   * Delay in milliseconds before attempting a retry.
   */
  retryDelay: number;
  /**
   * Prescribed recovery strategy for resolving the error.
   */
  recoveryStrategy: ErrorRecoveryStrategy;
  /**
   * Environment and user context captured at error instantiation.
   */
  context: ErrorContext;
  /**
   * User-friendly recommendations or resolution steps.
   */
  suggestions: string[];
}

/**
 * Base class for application errors with rich contextual metadata, retry tracking, and serializability.
 */
export class EnhancedError extends Error {
  /**
   * Unique error instance identifier for logging and tracing.
   */
  public readonly id: string;
  /**
   * Functional category of the error.
   */
  public readonly category: ErrorCategory;
  /**
   * Severity level indicating the impact of the error.
   */
  public readonly severity: ErrorSeverity;
  /**
   * Whether the failed operation can be retried automatically.
   */
  public readonly isRetryable: boolean;
  /**
   * Maximum retry attempts permitted for this error.
   */
  public readonly maxRetries: number;
  /**
   * Backoff delay in milliseconds before triggering a retry.
   */
  public readonly retryDelay: number;
  /**
   * Recommended remediation strategy to recover from the error.
   */
  public readonly recoveryStrategy: ErrorRecoveryStrategy;
  /**
   * Contextual telemetry captured when the error occurred.
   */
  public readonly context: ErrorContext;
  /**
   * Array of actionable suggestions for user or developer troubleshooting.
   */
  public readonly suggestions: string[];
  /**
   * The timestamp when the error was instantiated.
   */
  public readonly timestamp: Date;
  /**
   * The underlying causal Error object, if any.
   */
  public readonly cause?: Error;
  /**
   * Counter tracking how many retry attempts have occurred.
   */
  public retryCount: number = 0;

  /**
   * Creates a new EnhancedError instance with structured metadata and context.
   * @param message - Human-readable error description.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message);
    this.name = this.constructor.name;

    this.id =
      options.id ||
      `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.category = options.category || ErrorCategory.UNKNOWN;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.isRetryable = options.isRetryable ?? false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.recoveryStrategy =
      options.recoveryStrategy || ErrorRecoveryStrategy.USER_ACTION;
    this.suggestions = options.suggestions || [];
    this.timestamp = new Date();

    this.context = {
      timestamp: this.timestamp,
      url:
        typeof window !== "undefined" && window.location
          ? window.location.href
          : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      ...options.context,
    };

    if (options.cause) {
      this.cause = options.cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error instance to a plain JSON-serializable object for logging and transport.
   * @returns Serialized error representation including metadata, context, and stack trace.
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      isRetryable: this.isRetryable,
      maxRetries: this.maxRetries,
      retryCount: this.retryCount,
      retryDelay: this.retryDelay,
      recoveryStrategy: this.recoveryStrategy,
      context: this.context,
      suggestions: this.suggestions,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
    };
  }
}

/**
 * Specialized error class representing network connectivity failures and timeout events.
 */
export class NetworkError extends EnhancedError {
  /**
   * Creates a new NetworkError instance preconfigured with network recovery defaults.
   * @param message - Human-readable network error message.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      isRetryable: true,
      maxRetries: 3,
      retryDelay: 2000,
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      suggestions: [
        "Check your internet connection",
        "Try again in a few moments",
        "Contact support if the problem persists",
      ],
      ...options,
    });
  }
}

/**
 * Specialized error class representing API communication and HTTP response failures.
 */
export class APIError extends EnhancedError {
  /**
   * HTTP response status code associated with the failure.
   */
  public readonly statusCode?: number;
  /**
   * API endpoint URL where the request failed.
   */
  public readonly endpoint?: string;

  /**
   * Creates a new APIError instance with status code, endpoint, and appropriate retry settings.
   * @param message - Human-readable API error message.
   * @param statusCode - HTTP status code returned by the server.
   * @param endpoint - Target API endpoint path or URL.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.API,
      severity:
        statusCode && statusCode >= 500
          ? ErrorSeverity.HIGH
          : ErrorSeverity.MEDIUM,
      isRetryable: statusCode ? statusCode >= 500 || statusCode === 429 : false,
      maxRetries: 3,
      retryDelay: statusCode === 429 ? 5000 : 2000,
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      suggestions: [
        statusCode === 401 ? "Please log in again" : "Try refreshing the page",
        statusCode === 429
          ? "Please wait a moment before trying again"
          : "Contact support if the issue persists",
      ],
      ...options,
    });

    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * Specialized error class for form, schema, or parameter validation failures.
 */
export class ValidationError extends EnhancedError {
  /**
   * Specific field name or key that failed validation.
   */
  public readonly field?: string;
  /**
   * The invalid value that caused the validation failure.
   */
  public readonly value?: unknown;

  /**
   * Creates a new ValidationError instance targeting an invalid field value.
   * @param message - Human-readable validation error message.
   * @param field - Name of the invalid field.
   * @param value - The rejected value.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    field?: string,
    value?: unknown,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      isRetryable: false,
      recoveryStrategy: ErrorRecoveryStrategy.USER_ACTION,
      suggestions: [
        "Please check your input and try again",
        "Make sure all required fields are filled",
        "Verify the format of your data",
      ],
      ...options,
    });

    this.field = field;
    this.value = value;
  }
}

/**
 * Specialized error class representing authentication failures or expired credentials.
 */
export class AuthenticationError extends EnhancedError {
  /**
   * Creates a new AuthenticationError instance preconfigured for authentication redirect recovery.
   * @param message - Human-readable authentication error message.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      isRetryable: false,
      recoveryStrategy: ErrorRecoveryStrategy.REDIRECT,
      suggestions: [
        "Please log in again",
        "Check your credentials",
        "Contact support if you continue to have issues",
      ],
      ...options,
    });
  }
}

/**
 * Specialized error class representing client-side performance degradation or threshold breaches.
 */
export class PerformanceError extends EnhancedError {
  /**
   * Name of the performance metric that was violated (e.g., render duration, memory limit).
   */
  public readonly metric?: string;
  /**
   * Expected threshold value for the metric.
   */
  public readonly threshold?: number;
  /**
   * Actual measured value of the metric.
   */
  public readonly actual?: number;

  /**
   * Creates a new PerformanceError instance with benchmark metric details.
   * @param message - Human-readable performance warning/error message.
   * @param metric - Name of the monitored performance metric.
   * @param threshold - Acceptable threshold limit.
   * @param actual - Measured benchmark value.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    metric?: string,
    threshold?: number,
    actual?: number,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.PERFORMANCE,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true,
      maxRetries: 2,
      recoveryStrategy: ErrorRecoveryStrategy.FALLBACK,
      suggestions: [
        "Try reducing the amount of data being processed",
        "Close other browser tabs to free up memory",
        "Refresh the page to clear temporary data",
      ],
      ...options,
    });

    this.metric = metric;
    this.threshold = threshold;
    this.actual = actual;
  }
}

/**
 * Specialized error class for React component rendering, DOM, or visual presentation errors.
 */
export class UIError extends EnhancedError {
  /**
   * Name of the React component where the rendering error occurred.
   */
  public readonly componentName?: string;
  /**
   * Props passed to the component at the time of failure.
   */
  public readonly props?: Record<string, unknown>;

  /**
   * Creates a new UIError instance with component debug context.
   * @param message - Human-readable UI error message.
   * @param componentName - Name of the failing component.
   * @param props - Component properties at failure.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    componentName?: string,
    props?: Record<string, unknown>,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.UI,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true,
      maxRetries: 2,
      recoveryStrategy: ErrorRecoveryStrategy.FALLBACK,
      suggestions: [
        "Try refreshing the page",
        "Clear browser cache and data",
        "Update your browser to the latest version",
      ],
      ...options,
    });

    this.componentName = componentName;
    this.props = props;
  }
}

/**
 * Specialized error class representing domain logic violations or unmet business constraints.
 */
export class BusinessLogicError extends EnhancedError {
  /**
   * Identifier or name of the business rule that was violated.
   */
  public readonly rule?: string;
  /**
   * Domain-specific context and payload relevant to the business logic failure.
   */
  public readonly businessContext?: Record<string, unknown>;

  /**
   * Creates a new BusinessLogicError instance with domain rule context.
   * @param message - Human-readable business logic error description.
   * @param rule - Identifier of the violated business rule.
   * @param businessContext - Context data relating to the business workflow.
   * @param options - Optional metadata overrides and underlying causal error.
   */
  constructor(
    message: string,
    rule?: string,
    businessContext?: Record<string, unknown>,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      recoveryStrategy: ErrorRecoveryStrategy.USER_ACTION,
      suggestions: [
        "Please review the operation and try again",
        "Check that all business requirements are met",
        "Contact support for assistance with this process",
      ],
      ...options,
    });

    this.rule = rule;
    this.businessContext = businessContext;
  }
}

/**
 * Utility helper methods for inspecting, augmenting, classifying, and resolving standard and enhanced errors.
 */
export class ErrorUtils {
  /**
   * Converts a standard JavaScript Error into an EnhancedError, preserving the original cause.
   * @param error - The standard Error or EnhancedError to enhance.
   * @param options - Optional metadata overrides to apply.
   * @returns EnhancedError instance with structured metadata.
   */
  static enhance(
    error: Error,
    options: Partial<ErrorMetadata> = {},
  ): EnhancedError {
    if (error instanceof EnhancedError) {
      return error;
    }

    return new EnhancedError(error.message, {
      cause: error,
      ...options,
    });
  }

  /**
   * Determines whether an error is transient and eligible for automated retry attempts.
   * @param error - The Error instance to evaluate.
   * @returns True if the error indicates a retryable condition, false otherwise.
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof EnhancedError) {
      return error.isRetryable && error.retryCount < error.maxRetries;
    }

    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /500/i,
      /502/i,
      /503/i,
      /504/i,
      /connection/i,
      /fetch/i,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Computes or retrieves the severity level for a given error instance.
   * @param error - The Error instance to assess.
   * @returns Inferred or assigned ErrorSeverity value.
   */
  static getSeverity(error: Error): ErrorSeverity {
    if (error instanceof EnhancedError) {
      return error.severity;
    }

    if (error.message.toLowerCase().includes("critical")) {
      return ErrorSeverity.CRITICAL;
    }
    if (error.message.toLowerCase().includes("fatal")) {
      return ErrorSeverity.HIGH;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Categorizes a general error into a designated ErrorCategory based on message patterns or metadata.
   * @param error - The Error instance to categorize.
   * @returns Resolved ErrorCategory.
   */
  static getCategory(error: Error): ErrorCategory {
    if (error instanceof EnhancedError) {
      return error.category;
    }

    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes("auth") || message.includes("permission")) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes("performance") || message.includes("timeout")) {
      return ErrorCategory.PERFORMANCE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Generates a list of recommended recovery actions based on error category or existing metadata.
   * @param error - The Error instance to extract suggestions for.
   * @returns Array of actionable suggestion strings for users/developers.
   */
  static getSuggestions(error: Error): string[] {
    if (error instanceof EnhancedError) {
      return error.suggestions;
    }

    const category = ErrorUtils.getCategory(error);

    switch (category) {
      case ErrorCategory.NETWORK:
        return [
          "Check your internet connection",
          "Try again in a few moments",
          "Contact support if the problem persists",
        ];
      case ErrorCategory.VALIDATION:
        return [
          "Please check your input and try again",
          "Make sure all required fields are filled",
          "Verify the format of your data",
        ];
      case ErrorCategory.AUTHENTICATION:
        return [
          "Please log in again",
          "Check your credentials",
          "Contact support if you continue to have issues",
        ];
      default:
        return [
          "Try refreshing the page",
          "Clear browser cache and data",
          "Contact support if the problem persists",
        ];
    }
  }
}
