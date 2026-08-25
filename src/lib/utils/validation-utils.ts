/**
 * Result structure returned by validation operations.
 */
export interface ValidationResult {
  /** Indicates whether the validation passed without critical errors. */
  isValid: boolean;
  /** List of fatal validation error messages. */
  errors: string[];
  /** List of non-fatal validation warning messages. */
  warnings: string[];
}

/**
 * Supported value types for configurable service parameters.
 */
export type ParameterValue =
  | string
  | number
  | boolean
  | object
  | null
  | undefined;

/**
 * Validation state and metadata for a specific named parameter.
 */
export interface ParameterValidation {
  /** Name identifier of the parameter. */
  name: string;
  /** Expected type definition for the parameter (e.g., 'string', 'number', 'email', 'url'). */
  type: string;
  /** Whether the parameter is mandatory. */
  required: boolean;
  /** Current value of the parameter being validated. */
  value: ParameterValue;
  /** Whether the parameter value satisfies all validation constraints. */
  isValid: boolean;
  /** Error message detailing why validation failed, if applicable. */
  error?: string;
}

/**
 * Utility class providing static methods for validating services, methods, HTTP parameters, URLs, and environments.
 */
export class ValidationUtils {
  /**
   * Validates a service name and method against permitted services and naming conventions.
   *
   * @param service - The service identifier to validate.
   * @param method - The procedure or method name to validate.
   * @returns A ValidationResult indicating whether the service/method pair is valid along with any errors or warnings.
   */
  static validateServiceMethod(
    service: string,
    method: string,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!service || typeof service !== "string") {
      errors.push("Service name is required and must be a string");
    }

    if (!method || typeof method !== "string") {
      errors.push("Method name is required and must be a string");
    }

    const validServices = ["health", "auth", "projects", "security"];
    if (service && !validServices.includes(service)) {
      warnings.push(
        `Unknown service: ${service}. Valid services: ${validServices.join(", ")}`,
      );
    }

    if (method && !/^[a-zA-Z][a-zA-Z0-9]*$/.test(method)) {
      warnings.push(
        "Method name should start with a letter and contain only alphanumeric characters",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates an array of parameter specifications against a map of actual parameter values.
   *
   * @param parameters - List of parameter definitions including name, expected type, and required flag.
   * @param values - Key-value map containing the provided parameter values.
   * @returns An array of ParameterValidation results describing the validity and potential errors for each parameter.
   */
  static validateParameters(
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>,
    values: Record<string, ParameterValue>,
  ): ParameterValidation[] {
    return parameters.map((param) => {
      const value = values[param.name];
      const validation: ParameterValidation = {
        name: param.name,
        type: param.type,
        required: param.required,
        value,
        isValid: true,
      };

      if (
        param.required &&
        (value === undefined || value === null || value === "")
      ) {
        validation.isValid = false;
        validation.error = `${param.name} is required`;
        return validation;
      }

      if (
        !param.required &&
        (value === undefined || value === null || value === "")
      ) {
        return validation;
      }

      switch (param.type) {
        case "string":
          if (typeof value !== "string") {
            validation.isValid = false;
            validation.error = `${param.name} must be a string`;
          }
          break;

        case "number":
          if (typeof value !== "number" || isNaN(value)) {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid number`;
          }
          break;

        case "boolean":
          if (typeof value !== "boolean") {
            validation.isValid = false;
            validation.error = `${param.name} must be a boolean`;
          }
          break;

        case "object":
          try {
            if (typeof value === "string") {
              JSON.parse(value);
            } else if (typeof value !== "object" || value === null) {
              validation.isValid = false;
              validation.error = `${param.name} must be a valid object or JSON string`;
            }
          } catch {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid JSON object`;
          }
          break;

        case "email": {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof value !== "string" || !emailRegex.test(value)) {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid email address`;
          }
          break;
        }

        case "url":
          try {
            if (typeof value !== "string") {
              throw new Error("Value must be a string");
            }
            new URL(value);
          } catch {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid URL`;
          }
          break;

        default:
          if (value === undefined || value === null) {
            validation.isValid = false;
            validation.error = `${param.name} is required`;
          }
      }

      return validation;
    });
  }

  /**
   * Validates an HTTP method string against allowed verbs and ensures compatibility with query or mutation operations.
   *
   * @param method - The HTTP verb (e.g. GET, POST, PUT, DELETE, PATCH).
   * @param type - The operation category, either 'query' or 'mutation'.
   * @returns A ValidationResult indicating validity and any HTTP method semantic warnings.
   */
  static validateHttpMethod(
    method: string,
    type: "query" | "mutation",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    if (!validMethods.includes(method)) {
      errors.push(
        `Invalid HTTP method: ${method}. Valid methods: ${validMethods.join(", ")}`,
      );
    }

    if (type === "query" && method !== "GET") {
      warnings.push("Query procedures typically use GET method");
    }

    if (type === "mutation" && method === "GET") {
      warnings.push("Mutation procedures should not use GET method");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitizes a given parameter value to conform to its expected target type.
   *
   * @param value - The input parameter value to normalize or cast.
   * @param type - The target type representation ('string', 'number', 'boolean', 'object').
   * @returns The sanitized value coerced or parsed according to the target type.
   */
  static sanitizeValue(value: ParameterValue, type: string): ParameterValue {
    if (value === undefined || value === null) {
      return value;
    }

    switch (type) {
      case "string":
        return String(value).trim();

      case "number": {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      }

      case "boolean":
        if (typeof value === "string") {
          return value.toLowerCase() === "true" || value === "1";
        }
        return Boolean(value);

      case "object":
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Validates a URL string for proper structure, supported protocol, and hostname existence.
   *
   * @param url - The URL string to inspect.
   * @returns A ValidationResult indicating whether the URL is valid.
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const parsed = new URL(url);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        warnings.push("URL should use HTTP or HTTPS protocol");
      }

      if (!parsed.hostname) {
        errors.push("URL must have a valid hostname");
      }
    } catch {
      errors.push("Invalid URL format");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates essential and optional environment variables necessary for runtime configuration.
   *
   * @returns A ValidationResult reflecting the presence and correctness of environment variables.
   */
  static validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredEnvVars = ["NEXT_PUBLIC_API_URL"];

    const optionalEnvVars = ["NEXT_PUBLIC_BASE_URL"];

    requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    });

    optionalEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        warnings.push(`Missing optional environment variable: ${envVar}`);
      }
    });

    if (process.env.NEXT_PUBLIC_API_URL) {
      const urlValidation = this.validateUrl(process.env.NEXT_PUBLIC_API_URL);
      errors.push(...urlValidation.errors);
      warnings.push(...urlValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Formats errors and warnings from a ValidationResult into a human-readable multiline string.
   *
   * @param validation - The validation result object to format.
   * @returns A formatted string listing errors and warnings, or an empty string if valid.
   */
  static formatValidationErrors(validation: ValidationResult): string {
    if (validation.isValid) {
      return "";
    }

    const parts: string[] = [];

    if (validation.errors.length > 0) {
      parts.push("Errors:");
      validation.errors.forEach((error) => parts.push(`• ${error}`));
    }

    if (validation.warnings.length > 0) {
      parts.push("Warnings:");
      validation.warnings.forEach((warning) => parts.push(`• ${warning}`));
    }

    return parts.join("\n");
  }

  /**
   * Checks whether a given value is empty (null, undefined, whitespace string, empty array, or empty object).
   *
   * @param value - The unknown input value to test.
   * @returns True if the value is deemed empty, otherwise false.
   */
  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === "string") {
      return value.trim() === "";
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === "object") {
      return Object.keys(value).length === 0;
    }

    return false;
  }

  /**
   * Validates the serialized size of a payload against a maximum threshold in kilobytes.
   *
   * @param payload - The data payload to evaluate.
   * @param maxSizeKB - The maximum allowed size in kilobytes (defaults to 1024 KB).
   * @returns A ValidationResult indicating whether the payload is within acceptable size limits.
   */
  static validatePayloadSize(
    payload: unknown,
    maxSizeKB: number = 1024,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const payloadString = JSON.stringify(payload);
      const sizeInBytes = new Blob([payloadString]).size;
      const sizeInKB = sizeInBytes / 1024;

      if (sizeInKB > maxSizeKB) {
        errors.push(
          `Payload size (${sizeInKB.toFixed(2)}KB) exceeds maximum allowed size (${maxSizeKB}KB)`,
        );
      } else if (sizeInKB > maxSizeKB * 0.8) {
        warnings.push(
          `Payload size (${sizeInKB.toFixed(2)}KB) is approaching the limit (${maxSizeKB}KB)`,
        );
      }
    } catch {
      errors.push("Unable to calculate payload size");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
