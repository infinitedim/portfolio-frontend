/**
 * Base abstract class for all custom application domain errors.
 * Provides standardized error codes, HTTP status codes, structured context, and serialization.
 */
export abstract class AppError extends Error {
  /** Unique domain-specific error code identifier. */
  abstract readonly code: string;
  /** Corresponding HTTP response status code for this error. */
  abstract readonly statusCode: number;
  /** Timestamp when the error instance was instantiated. */
  readonly timestamp: Date;
  /** Optional structured context metadata providing additional debugging information. */
  readonly context?: Record<string, unknown>;

  /**
   * Constructs a new AppError instance.
   *
   * @param message - Human-readable error description message.
   * @param context - Optional key-value record with arbitrary diagnostic metadata.
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializes the error instance into a structured JSON-compatible object.
   *
   * @returns Detailed serialized error object containing name, code, message, statusCode, timestamp, context, and optional stack trace.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
    };
  }

  /**
   * Converts the error into a sanitized client-safe representation without internal traces.
   *
   * @returns Client-safe error object containing code, message, and statusCode.
   */
  toClientError(): { code: string; message: string; statusCode: number } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Error thrown when input validation fails (HTTP 400 Bad Request).
 */
export class ValidationError extends AppError {
  /** Specific error code for validation errors. */
  readonly code = "VALIDATION_ERROR";
  /** HTTP 400 Bad Request status code. */
  readonly statusCode = 400;
  /** The specific input field name that failed validation, if isolated. */
  readonly field?: string;
  /** Map of violated validation constraints and their corresponding error messages. */
  readonly constraints?: Record<string, string>;

  /**
   * Constructs a new ValidationError instance.
   *
   * @param message - Validation error description.
   * @param options - Optional configuration including specific field, constraint map, or additional context.
   * @param options.field - Specific field that failed validation.
   * @param options.constraints - Map of violated constraints and messages.
   * @param options.context - Additional diagnostic metadata context.
   */
  constructor(
    message: string,
    options?: {
      field?: string;
      constraints?: Record<string, string>;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options?.context);
    this.field = options?.field;
    this.constraints = options?.constraints;
  }

  /**
   * Factory method to create a ValidationError for a specific form or payload field.
   *
   * @param field - Name of the invalid field.
   * @param message - Reason why the field value is invalid.
   * @returns A new ValidationError instance configured with the field name.
   */
  static fromField(field: string, message: string): ValidationError {
    return new ValidationError(message, { field });
  }

  /**
   * Factory method to create a ValidationError from a record of constraint failure messages.
   *
   * @param constraints - Key-value map of constraint names to failure messages.
   * @returns A new ValidationError aggregating all constraint failure messages.
   */
  static fromConstraints(constraints: Record<string, string>): ValidationError {
    const messages = Object.values(constraints);
    return new ValidationError(messages.join(", "), { constraints });
  }
}

/**
 * Error thrown when an unauthenticated request is received or credentials are missing/invalid (HTTP 401 Unauthorized).
 */
export class AuthenticationError extends AppError {
  /** Specific error code for authentication errors. */
  readonly code = "AUTHENTICATION_ERROR";
  /** HTTP 401 Unauthorized status code. */
  readonly statusCode = 401;

  /**
   * Constructs a new AuthenticationError instance.
   *
   * @param message - Description of the authentication failure (defaults to "Authentication required").
   * @param context - Optional diagnostic context metadata.
   */
  constructor(
    message: string = "Authentication required",
    context?: Record<string, unknown>,
  ) {
    super(message, context);
  }

  /**
   * Factory method for invalid user credentials (email/password).
   *
   * @returns A new AuthenticationError for invalid credentials.
   */
  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError("Invalid email or password");
  }

  /**
   * Factory method for expired access tokens.
   *
   * @returns A new AuthenticationError for expired token.
   */
  static tokenExpired(): AuthenticationError {
    return new AuthenticationError("Token has expired");
  }

  /**
   * Factory method for malformed or unverifiable access tokens.
   *
   * @returns A new AuthenticationError for invalid token.
   */
  static tokenInvalid(): AuthenticationError {
    return new AuthenticationError("Invalid token");
  }

  /**
   * Factory method for expired session states.
   *
   * @returns A new AuthenticationError for expired session.
   */
  static sessionExpired(): AuthenticationError {
    return new AuthenticationError("Session has expired");
  }
}

/**
 * Error thrown when an authenticated user lacks permission to access a requested resource or perform an action (HTTP 403 Forbidden).
 */
export class AuthorizationError extends AppError {
  /** Specific error code for authorization errors. */
  readonly code = "AUTHORIZATION_ERROR";
  /** HTTP 403 Forbidden status code. */
  readonly statusCode = 403;
  /** The specific role or permission required that was missing. */
  readonly requiredPermission?: string;

  /**
   * Constructs a new AuthorizationError instance.
   *
   * @param message - Description of the authorization rejection.
   * @param requiredPermission - Specific permission key required to execute the action.
   * @param context - Optional diagnostic context metadata.
   */
  constructor(
    message: string = "You do not have permission to perform this action",
    requiredPermission?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.requiredPermission = requiredPermission;
  }

  /**
   * Factory method for permission insufficiency errors.
   *
   * @param permission - Missing required permission identifier.
   * @returns A new AuthorizationError instance describing the missing permission.
   */
  static insufficientPermissions(permission: string): AuthorizationError {
    return new AuthorizationError(
      `Insufficient permissions: ${permission} required`,
      permission,
    );
  }

  /**
   * Factory method for operations strictly requiring administrator access.
   *
   * @returns A new AuthorizationError requiring admin access.
   */
  static adminRequired(): AuthorizationError {
    return new AuthorizationError("Admin access required", "admin");
  }
}

/**
 * Error thrown when a requested resource or entity could not be found (HTTP 404 Not Found).
 */
export class NotFoundError extends AppError {
  /** Specific error code for not found errors. */
  readonly code = "NOT_FOUND";
  /** HTTP 404 Not Found status code. */
  readonly statusCode = 404;
  /** Name or type of the resource that was not located (e.g., 'User', 'Post'). */
  readonly resource?: string;
  /** Unique identifier or key searched for. */
  readonly identifier?: string;

  /**
   * Constructs a new NotFoundError instance.
   *
   * @param message - Description of the missing resource (defaults to "Resource not found").
   * @param options - Optional details including resource type, identifier searched, and context.
   * @param options.resource - Name or type of the missing resource.
   * @param options.identifier - Identifier or query key that was not found.
   * @param options.context - Additional diagnostic metadata context.
   */
  constructor(
    message: string = "Resource not found",
    options?: {
      resource?: string;
      identifier?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options?.context);
    this.resource = options?.resource;
    this.identifier = options?.identifier;
  }

  /**
   * Factory method creating a NotFoundError for a specific resource type and optional identifier.
   *
   * @param resource - Type name of the resource (e.g. "Post", "User").
   * @param identifier - Optional unique identifier or slug of the resource.
   * @returns A new configured NotFoundError instance.
   */
  static forResource(resource: string, identifier?: string): NotFoundError {
    const msg = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    return new NotFoundError(msg, { resource, identifier });
  }
}

/**
 * Error thrown when an operation conflicts with the current state of a resource (HTTP 409 Conflict).
 */
export class ConflictError extends AppError {
  /** Specific error code for conflict errors. */
  readonly code = "CONFLICT";
  /** HTTP 409 Conflict status code. */
  readonly statusCode = 409;

  /**
   * Constructs a new ConflictError instance.
   *
   * @param message - Description of the conflict condition (defaults to "Resource conflict").
   * @param context - Optional diagnostic context metadata.
   */
  constructor(
    message: string = "Resource conflict",
    context?: Record<string, unknown>,
  ) {
    super(message, context);
  }

  /**
   * Factory method for duplicate resource or unique constraint collisions.
   *
   * @param resource - Name of the resource encountering conflict.
   * @param field - Optional conflicting unique field name (e.g. 'email', 'slug').
   * @returns A new ConflictError instance.
   */
  static alreadyExists(resource: string, field?: string): ConflictError {
    const msg = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    return new ConflictError(msg);
  }
}

/**
 * Error thrown when a user or client exceeds request rate limits (HTTP 429 Too Many Requests).
 */
export class RateLimitError extends AppError {
  /** Specific error code for rate limit errors. */
  readonly code = "RATE_LIMIT_EXCEEDED";
  /** HTTP 429 Too Many Requests status code. */
  readonly statusCode = 429;
  /** Number of seconds after which the client should retry the request. */
  readonly retryAfter?: number;

  /**
   * Constructs a new RateLimitError instance.
   *
   * @param message - Rate limit message description (defaults to "Too many requests").
   * @param retryAfter - Optional wait duration in seconds before retrying.
   * @param context - Optional diagnostic context metadata.
   */
  constructor(
    message: string = "Too many requests",
    retryAfter?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.retryAfter = retryAfter;
  }

  /**
   * Factory method creating a RateLimitError with a specific retry duration.
   *
   * @param retryAfter - Number of seconds client must wait.
   * @returns A new RateLimitError instance.
   */
  static withRetry(retryAfter: number): RateLimitError {
    return new RateLimitError(
      `Too many requests. Please try again in ${retryAfter} seconds`,
      retryAfter,
    );
  }
}

/**
 * Error thrown when an external network service or API gateway fails (HTTP 502 Bad Gateway).
 */
export class NetworkError extends AppError {
  /** Specific error code for network errors. */
  readonly code = "NETWORK_ERROR";
  /** HTTP 502 Bad Gateway status code. */
  readonly statusCode = 502;
  /** Name of the external or downstream service that failed. */
  readonly service?: string;
  /** The underlying original error that caused this network failure. */
  readonly originalError?: Error;

  /**
   * Constructs a new NetworkError instance.
   *
   * @param message - Description of the network error (defaults to "Network error occurred").
   * @param options - Optional service name, underlying original error, and context.
   * @param options.service - Name of the remote or downstream service that failed.
   * @param options.originalError - Original underlying error instance.
   * @param options.context - Additional diagnostic metadata context.
   */
  constructor(
    message: string = "Network error occurred",
    options?: {
      service?: string;
      originalError?: Error;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options?.context);
    this.service = options?.service;
    this.originalError = options?.originalError;
  }

  /**
   * Factory method for connection failures to a specific downstream service.
   *
   * @param service - Name of the remote service (e.g. 'Authentication Server', 'Stripe').
   * @param originalError - Optional captured root cause error.
   * @returns A new NetworkError instance.
   */
  static fromService(service: string, originalError?: Error): NetworkError {
    return new NetworkError(`Failed to connect to ${service}`, {
      service,
      originalError,
    });
  }

  /**
   * Factory method for timed-out network requests.
   *
   * @param service - Optional service name that timed out.
   * @returns A new NetworkError instance.
   */
  static timeout(service?: string): NetworkError {
    const msg = service
      ? `Request to ${service} timed out`
      : "Request timed out";
    return new NetworkError(msg, { service });
  }
}

/**
 * Error thrown when a database query or connection operation fails (HTTP 500 Internal Server Error).
 */
export class DatabaseError extends AppError {
  /** Specific error code for database errors. */
  readonly code = "DATABASE_ERROR";
  /** HTTP 500 Internal Server Error status code. */
  readonly statusCode = 500;
  /** Name of the database operation that failed (e.g., 'insert', 'find', 'connect'). */
  readonly operation?: string;

  /**
   * Constructs a new DatabaseError instance.
   *
   * @param message - Description of the database error (defaults to "Database operation failed").
   * @param operation - Optional database operation identifier.
   * @param context - Optional diagnostic context metadata.
   */
  constructor(
    message: string = "Database operation failed",
    operation?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.operation = operation;
  }

  /**
   * Factory method for failed database queries.
   *
   * @param operation - Description or name of the failed query/operation.
   * @returns A new DatabaseError instance.
   */
  static queryFailed(operation: string): DatabaseError {
    return new DatabaseError(`Database ${operation} failed`, operation);
  }

  /**
   * Factory method for database connection failures.
   *
   * @returns A new DatabaseError instance indicating connection failure.
   */
  static connectionFailed(): DatabaseError {
    return new DatabaseError("Failed to connect to database", "connect");
  }
}

/**
 * Generic internal error thrown when an unexpected failure occurs in the application (HTTP 500 Internal Server Error).
 */
export class InternalError extends AppError {
  /** Specific error code for internal errors. */
  readonly code = "INTERNAL_ERROR";
  /** HTTP 500 Internal Server Error status code. */
  readonly statusCode = 500;
  /** The underlying original error captured, if any. */
  readonly originalError?: Error;

  /**
   * Constructs a new InternalError instance.
   *
   * @param message - Description of the internal error (defaults to "An unexpected error occurred").
   * @param originalError - Optional underlying error object.
   * @param context - Optional diagnostic context metadata.
   */
  constructor(
    message: string = "An unexpected error occurred",
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.originalError = originalError;
  }

  /**
   * Factory method to wrap an unknown thrown error into an InternalError instance.
   *
   * @param error - Unknown error caught in try/catch block.
   * @returns A standardized InternalError instance.
   */
  static fromError(error: unknown): InternalError {
    if (error instanceof Error) {
      return new InternalError(error.message, error);
    }
    return new InternalError(String(error));
  }
}

/**
 * Type guard function to verify whether a given value is an instance of AppError.
 *
 * @param error - Value to check.
 * @returns True if error is an instance of AppError, otherwise false.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Converts any unknown error into an AppError instance. If the error is already an AppError,
 * it is returned directly; otherwise, it is wrapped in an InternalError.
 *
 * @param error - Unknown error to convert.
 * @returns A guaranteed AppError instance.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  return InternalError.fromError(error);
}

/**
 * Constant dictionary of standard error code identifiers used throughout the application.
 */
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR: "NETWORK_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * Union type representing all valid error codes defined in ErrorCodes.
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

