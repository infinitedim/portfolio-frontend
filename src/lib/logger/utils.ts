/**
 * Logging Utility Functions
 * Helper functions for PII masking, sanitization, and formatting
 */

import {
  PII_PATTERNS,
  SENSITIVE_HEADERS,
  SENSITIVE_FIELDS,
} from "./config";

/**
 * Mask email addresses
 * Example: user@example.com -> u***@***.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***.***";

  const maskedLocal = local.charAt(0) + "***";
  const maskedDomain = "***." + domain.split(".").pop();

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask phone numbers
 * Example: 555-123-4567 -> ***-***-4567
 */
function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return "***";

  const lastFour = cleaned.slice(-4);
  return `***-***-${lastFour}`;
}

/**
 * Mask credit card numbers
 * Example: 1234-5678-9012-3456 -> ****-****-****-3456
 */
function maskCreditCard(card: string): string {
  const cleaned = card.replace(/\D/g, "");
  if (cleaned.length < 4) return "****";

  const lastFour = cleaned.slice(-4);
  return `****-****-****-${lastFour}`;
}

/**
 * Mask IP addresses
 * Example: 192.168.1.1 -> ***.***.***.1
 */
function maskIpAddress(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) return "***.***.***.***.***";

  return `***.***.***.${parts[3]}`;
}

/**
 * Mask PII in a string
 */
export function maskPIIString(text: string): string {
  let masked = text;

  // Mask emails
  masked = masked.replace(PII_PATTERNS.email, (match) => maskEmail(match));

  // Mask phone numbers
  masked = masked.replace(PII_PATTERNS.phone, (match) => maskPhone(match));

  // Mask credit cards
  masked = masked.replace(PII_PATTERNS.creditCard, (match) => maskCreditCard(match));

  // Mask SSN
  masked = masked.replace(PII_PATTERNS.ssn, () => "***-**-****");

  // Mask IP addresses
  masked = masked.replace(PII_PATTERNS.ipv4, (match) => maskIpAddress(match));

  return masked;
}

/**
 * Mask PII in an object recursively
 */
export function maskPII(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return maskPIIString(data);
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(maskPII);
  }

  if (typeof data === "object") {
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Check if field name is sensitive
      const isSensitive = SENSITIVE_FIELDS.some(
        (field) => key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive) {
        masked[key] = "[REDACTED]";
      } else if (typeof value === "string") {
        masked[key] = maskPIIString(value);
      } else {
        masked[key] = maskPII(value);
      }
    }

    return masked;
  }

  return data;
}

/**
 * Sanitize HTTP headers by removing sensitive ones
 */
export function sanitizeHeaders(
  headers: Record<string, string> | Headers
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  const entries = headers instanceof Headers
    ? Array.from(headers.entries())
    : Object.entries(headers);

  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();

    // Skip sensitive headers
    if (SENSITIVE_HEADERS.some((h) => lowerKey.includes(h))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  [key: string]: unknown;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...("code" in error && { code: String(error.code) }),
      ...("statusCode" in error && { statusCode: error.statusCode }),
      ...("cause" in error && { cause: formatError(error.cause) }),
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
    };
  }

  if (error && typeof error === "object") {
    return {
      name: "UnknownError",
      message: JSON.stringify(error),
      raw: error,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}

/**
 * Get request context from browser environment
 */
export function getRequestContext(): {
  requestId?: string;
  sessionId?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  deviceType?: string;
} {
  if (typeof window === "undefined") {
    return {};
  }

  // Try to get request ID from cookie or generate new one
  const requestId = getCookie("x-request-id") || generateCorrelationId();

  // Try to get session ID from cookie
  const sessionId = getCookie("session-id");

  // Try to get user ID from cookie or localStorage (guard for test env)
  let userId = getCookie("user-id");
  if (userId === undefined && typeof localStorage !== "undefined" && localStorage?.getItem) {
    userId = localStorage.getItem("userId") ?? undefined;
  }

  // Get device type
  const deviceType = getDeviceType();

  return {
    requestId,
    sessionId,
    userId,
    url: window.location?.href,
    userAgent: navigator?.userAgent,
    deviceType,
  };
}

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined" || typeof document.cookie !== "string") {
    return undefined;
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return undefined;
}

/**
 * Detect device type
 */
function getDeviceType(): string {
  if (typeof window === "undefined" || typeof navigator?.userAgent !== "string") {
    return "unknown";
  }

  const ua = navigator.userAgent.toLowerCase();

  if (/mobile/i.test(ua)) {
    return "mobile";
  }

  if (/tablet|ipad/i.test(ua)) {
    return "tablet";
  }

  return "desktop";
}

/**
 * Check if code is running on client side
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Check if code is running on server side
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Safely stringify an object for logging
 */
export function safeStringify(obj: unknown, maxDepth = 5): string {
  const seen = new WeakSet();

  const stringify = (value: unknown, depth: number): string => {
    if (depth > maxDepth) {
      return "[Max Depth Exceeded]";
    }

    if (value === null) {
      return "null";
    }

    if (value === undefined) {
      return "undefined";
    }

    if (typeof value === "string") {
      return `"${value}"`;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (typeof value === "function") {
      return `[Function: ${value.name || "anonymous"}]`;
    }

    if (value instanceof Error) {
      return `[Error: ${value.message}]`;
    }

    if (Array.isArray(value)) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);

      const items = value.slice(0, 10).map((item) => stringify(item, depth + 1));
      const suffix = value.length > 10 ? `, ... ${value.length - 10} more` : "";
      return `[${items.join(", ")}${suffix}]`;
    }

    if (typeof value === "object") {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);

      const entries = Object.entries(value).slice(0, 10);
      const props = entries.map(
        ([k, v]) => `${k}: ${stringify(v, depth + 1)}`
      );
      const suffix = Object.keys(value).length > 10
        ? `, ... ${Object.keys(value).length - 10} more`
        : "";
      return `{${props.join(", ")}${suffix}}`;
    }

    return String(value);
  };

  try {
    return stringify(obj, 0);
  } catch (error) {
    return `[Stringify Error: ${error instanceof Error ? error.message : "unknown"}]`;
  }
}

/**
 * Truncate string to maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - 3) + "...";
}

/**
 * Calculate size of object in bytes (approximate)
 */
export function getObjectSize(obj: unknown): number {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
}
