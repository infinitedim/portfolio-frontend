/**
 * Logs API Route
 * Endpoint for receiving client logs from the frontend
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerLogger } from "@/lib/logger/server-logger";
import type { LogEntry } from "@/lib/logger/types";

const logger = createServerLogger("api/logs");

/**
 * Rate limiting map (in-memory, per IP)
 * In production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT = {
  maxRequests: 100, // Max requests per window
  windowMs: 60 * 1000, // 1 minute window
};

/**
 * Maximum batch size (logs per request)
 */
const MAX_BATCH_SIZE = 100;

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  // Clean up expired entries
  if (limit && now > limit.resetTime) {
    rateLimitMap.delete(ip);
  }

  // Get or create limit entry
  const currentLimit = rateLimitMap.get(ip) || {
    count: 0,
    resetTime: now + RATE_LIMIT.windowMs,
  };

  // Check if limit exceeded
  if (currentLimit.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  currentLimit.count++;
  rateLimitMap.set(ip, currentLimit);

  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - currentLimit.count,
  };
}

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Validate log entry
 */
function validateLogEntry(entry: unknown): entry is LogEntry {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const log = entry as Record<string, unknown>;

  // Check required fields
  if (
    typeof log.timestamp !== "string" ||
    typeof log.level !== "string" ||
    typeof log.message !== "string"
  ) {
    return false;
  }

  // Validate log level
  const validLevels = ["trace", "debug", "info", "warn", "error", "fatal"];
  if (!validLevels.includes(log.level)) {
    return false;
  }

  return true;
}

/**
 * POST /api/logs
 * Receive and process client logs
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    // Get client IP
    const clientIp = getClientIp(request);

    // Check rate limit
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for client logs", {
        requestId,
        component: "api/logs",
      }, {
        ip: clientIp,
        limit: RATE_LIMIT.maxRequests,
        window: RATE_LIMIT.windowMs,
      });

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(RATE_LIMIT.windowMs / 1000)),
            "X-RateLimit-Limit": String(RATE_LIMIT.maxRequests),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Check content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        {
          status: 400,
          headers: { "X-Request-ID": requestId },
        }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      logger.error("Failed to parse request body", error, {
        requestId,
        component: "api/logs",
      });

      return NextResponse.json(
        { error: "Invalid JSON" },
        {
          status: 400,
          headers: { "X-Request-ID": requestId },
        }
      );
    }

    // Validate request structure
    if (!body || typeof body !== "object" || !("logs" in body)) {
      return NextResponse.json(
        { error: "Request must contain 'logs' array" },
        {
          status: 400,
          headers: { "X-Request-ID": requestId },
        }
      );
    }

    const { logs } = body as { logs: unknown };

    // Validate logs array
    if (!Array.isArray(logs)) {
      return NextResponse.json(
        { error: "'logs' must be an array" },
        {
          status: 400,
          headers: { "X-Request-ID": requestId },
        }
      );
    }

    // Check batch size
    if (logs.length > MAX_BATCH_SIZE) {
      logger.warn("Batch size exceeded", {
        requestId,
        component: "api/logs",
      }, {
        batchSize: logs.length,
        maxBatchSize: MAX_BATCH_SIZE,
        ip: clientIp,
      });

      return NextResponse.json(
        {
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}`,
          received: logs.length,
          max: MAX_BATCH_SIZE,
        },
        {
          status: 413,
          headers: { "X-Request-ID": requestId },
        }
      );
    }

    // Validate and filter log entries
    const validLogs: LogEntry[] = [];
    const invalidLogs: number[] = [];

    for (let i = 0; i < logs.length; i++) {
      if (validateLogEntry(logs[i])) {
        validLogs.push(logs[i] as LogEntry);
      } else {
        invalidLogs.push(i);
      }
    }

    // Log client logs to server logger
    if (validLogs.length > 0) {
      const clientInfo = {
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || "unknown",
        referer: request.headers.get("referer"),
      };

      logger.logClientLogs(validLogs, clientInfo);

      logger.info("Client logs received", {
        requestId,
        component: "api/logs",
      }, {
        count: validLogs.length,
        invalidCount: invalidLogs.length,
        ip: clientIp,
      });
    }

    // Return response
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        received: logs.length,
        processed: validLogs.length,
        invalid: invalidLogs.length,
        batchId: requestId,
      },
      {
        status: 202, // Accepted
        headers: {
          "X-Request-ID": requestId,
          "X-Response-Time": `${responseTime}ms`,
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    logger.error("Failed to process client logs", error, {
      requestId,
      component: "api/logs",
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        requestId,
      },
      {
        status: 500,
        headers: { "X-Request-ID": requestId },
      }
    );
  }
}

/**
 * OPTIONS /api/logs
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Request-ID",
      "Access-Control-Max-Age": "86400",
    },
  });
}
