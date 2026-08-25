import { NextRequest, NextResponse } from "next/server";
import { createServerLogger } from "@/lib/logger/server-logger";
import type { LogEntry } from "@/lib/logger/types";
/**
 * Server-side logger instance for the API logs endpoint.
 */
const logger = createServerLogger("api/logs");

/**
 * In-memory map to track request counts and reset timestamps per IP address for rate limiting.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Configuration options for IP rate limiting on client log submissions.
 */
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000,
};

/**
 * Request counter used to trigger periodic pruning of expired rate limit entries.
 */
let pruneCounter = 0;

/**
 * Number of requests between periodic rate limit map pruning executions.
 */
const PRUNE_EVERY = 200;

/**
 * Removes expired entries from the in-memory rate limit map to prevent memory leaks.
 */
function pruneRateLimitMap(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

/**
 * Maximum allowed payload size in bytes for client log ingestion requests.
 */
const _MAX_PAYLOAD_SIZE = 1024 * 1024;

/**
 * Maximum number of log entries allowed in a single batch request.
 */
const MAX_BATCH_SIZE = 100;

/**
 * Evaluates whether an IP address is within the allowed request rate limit.
 *
 * @param ip - The client IP address to evaluate.
 * @returns An object indicating whether the request is allowed and the remaining request quota.
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();

  pruneCounter += 1;
  if (pruneCounter >= PRUNE_EVERY) {
    pruneCounter = 0;
    pruneRateLimitMap();
  }

  const limit = rateLimitMap.get(ip);

  if (limit && now > limit.resetTime) {
    rateLimitMap.delete(ip);
  }

  const currentLimit = rateLimitMap.get(ip) || {
    count: 0,
    resetTime: now + RATE_LIMIT.windowMs,
  };

  if (currentLimit.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  currentLimit.count++;
  rateLimitMap.set(ip, currentLimit);

  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - currentLimit.count,
  };
}

/**
 * Extracts the client IP address from request headers or falls back to 'unknown'.
 *
 * @param request - The incoming NextRequest instance.
 * @returns The resolved client IP address string.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Validates that an unknown input matches the shape of a valid LogEntry.
 *
 * @param entry - The candidate log entry object to validate.
 * @returns True if the object conforms to the LogEntry schema; otherwise false.
 */
function validateLogEntry(entry: unknown): entry is LogEntry {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const log = entry as Record<string, unknown>;

  if (
    typeof log.timestamp !== "string" ||
    typeof log.level !== "string" ||
    typeof log.message !== "string"
  ) {
    return false;
  }

  const validLevels = ["trace", "debug", "info", "warn", "error", "fatal"];
  if (!validLevels.includes(log.level)) {
    return false;
  }

  return true;
}

/**
 * Handles incoming POST requests to ingest client-side log entries.
 *
 * @param request - The incoming NextRequest containing the batch of logs.
 * @returns A promise resolving to a NextResponse with ingestion status and metadata.
 */
async function postHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const clientIp = getClientIp(request);

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      logger.warn(
        "Rate limit exceeded for client logs",
        {
          requestId,
          component: "api/logs",
        },
        {
          ip: clientIp,
          limit: RATE_LIMIT.maxRequests,
          window: RATE_LIMIT.windowMs,
        },
      );

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
        },
      );
    }

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        {
          status: 400,
          headers: { "X-Request-ID": requestId },
        },
      );
    }

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
        },
      );
    }

    if (!body || typeof body !== "object" || !("logs" in body)) {
      return NextResponse.json(
        { error: "Request must contain 'logs' array" },
        {
          status: 400,
          headers: { "X-Request-ID": requestId },
        },
      );
    }

    const { logs } = body as { logs: unknown };

    if (!Array.isArray(logs)) {
      return NextResponse.json(
        { error: "'logs' must be an array" },
        {
          status: 400,
          headers: { "X-Request-ID": requestId },
        },
      );
    }

    if (logs.length > MAX_BATCH_SIZE) {
      logger.warn(
        "Batch size exceeded",
        {
          requestId,
          component: "api/logs",
        },
        {
          batchSize: logs.length,
          maxBatchSize: MAX_BATCH_SIZE,
          ip: clientIp,
        },
      );

      return NextResponse.json(
        {
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}`,
          received: logs.length,
          max: MAX_BATCH_SIZE,
        },
        {
          status: 413,
          headers: { "X-Request-ID": requestId },
        },
      );
    }

    const validLogs: LogEntry[] = [];
    const invalidLogs: number[] = [];

    for (let i = 0; i < logs.length; i++) {
      if (validateLogEntry(logs[i])) {
        validLogs.push(logs[i] as LogEntry);
      } else {
        invalidLogs.push(i);
      }
    }

    if (validLogs.length > 0) {
      const clientInfo = {
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || "unknown",
        referer: request.headers.get("referer"),
      };

      logger.logClientLogs(validLogs, clientInfo);

      logger.info(
        "Client logs received",
        {
          requestId,
          component: "api/logs",
        },
        {
          count: validLogs.length,
          invalidCount: invalidLogs.length,
          ip: clientIp,
        },
      );
    }

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
        status: 202,
        headers: {
          "X-Request-ID": requestId,
          "X-Response-Time": `${responseTime}ms`,
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
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
      },
    );
  }
}

/**
 * Route handler for POST requests to ingest client log entries.
 */
export const POST = postHandler;

/**
 * Route handler for OPTIONS preflight requests on the logs endpoint.
 *
 * @returns A promise resolving to a NextResponse containing CORS preflight headers.
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
