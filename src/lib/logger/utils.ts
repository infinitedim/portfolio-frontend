

import {
  PII_PATTERNS,
  SENSITIVE_HEADERS,
  SENSITIVE_FIELDS,
} from "./config";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***.***";

  const maskedLocal = local.charAt(0) + "***";
  const maskedDomain = "***." + domain.split(".").pop();

  return `${maskedLocal}@${maskedDomain}`;
}

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return "***";

  const lastFour = cleaned.slice(-4);
  return `***-***-${lastFour}`;
}

function maskCreditCard(card: string): string {
  const cleaned = card.replace(/\D/g, "");
  if (cleaned.length < 4) return "****";

  const lastFour = cleaned.slice(-4);
  return `****-****-****-${lastFour}`;
}

function maskIpAddress(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) return "***.***.***.***.***";

  return `***.***.***.${parts[3]}`;
}

export function maskPIIString(text: string): string {
  let masked = text;

  
  masked = masked.replace(PII_PATTERNS.email, (match) => maskEmail(match));

  
  masked = masked.replace(PII_PATTERNS.phone, (match) => maskPhone(match));

  
  masked = masked.replace(PII_PATTERNS.creditCard, (match) => maskCreditCard(match));

  
  masked = masked.replace(PII_PATTERNS.ssn, () => "***-**-****");

  
  masked = masked.replace(PII_PATTERNS.ipv4, (match) => maskIpAddress(match));

  return masked;
}

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

export function sanitizeHeaders(
  headers: Record<string, string> | Headers
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  const entries = headers instanceof Headers
    ? Array.from(headers.entries())
    : Object.entries(headers);

  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();

    
    if (SENSITIVE_HEADERS.some((h) => lowerKey.includes(h))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

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

  
  const requestId = getCookie("x-request-id") || generateCorrelationId();

  
  const sessionId = getCookie("session-id");

  
  const userId = getCookie("user-id") || localStorage.getItem("userId") || undefined;

  
  const deviceType = getDeviceType();

  return {
    requestId,
    sessionId,
    userId,
    url: window.location.href,
    userAgent: navigator.userAgent,
    deviceType,
  };
}

export function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
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

function getDeviceType(): string {
  if (typeof window === "undefined") {
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

export function isClient(): boolean {
  return typeof window !== "undefined";
}

export function isServer(): boolean {
  return typeof window === "undefined";
}

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

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - 3) + "...";
}

export function getObjectSize(obj: unknown): number {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
}
