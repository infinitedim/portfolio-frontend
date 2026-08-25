/**
 * Rate limit evaluation result describing quota consumption and window reset timing.
 */
export interface RateLimitResult {
  /** Indicates whether the incoming request is permitted under rate limit thresholds. */
  allowed: boolean;
  /** Current count of requests received within the active time window. */
  count: number;
  /** Number of remaining requests permitted before reaching the limit. */
  remaining: number;
  /** Epoch timestamp in milliseconds when the current rate limit window resets. */
  resetAt: number;
  /** Identifier of the rate limiting storage engine used. */
  engineUsed: "memory-map";
}

/**
 * In-memory fallback map storing client request counts and window expiration timestamps.
 */
const memoryMapFallback = new Map<string, { count: number; resetAt: number }>();

/**
 * Evaluates and increments the rate limit counter for a specified client IP address.
 *
 * @param ip - The client IP address identifier.
 * @param limit - Maximum number of allowed requests within the time window (default: 60).
 * @param windowMs - Duration of the rolling rate limit window in milliseconds (default: 60000).
 * @returns A RateLimitResult detailing whether the request was allowed and remaining quota.
 */
export function checkSqliteRateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000,
): RateLimitResult {
  const now = Date.now();
  const resetAt = now + windowMs;

  const record = memoryMapFallback.get(ip);
  if (!record || record.resetAt < now) {
    memoryMapFallback.set(ip, { count: 1, resetAt });
    return {
      allowed: true,
      count: 1,
      remaining: limit - 1,
      resetAt,
      engineUsed: "memory-map",
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      count: record.count,
      remaining: 0,
      resetAt: record.resetAt,
      engineUsed: "memory-map",
    };
  }

  record.count += 1;
  return {
    allowed: true,
    count: record.count,
    remaining: Math.max(0, limit - record.count),
    resetAt: record.resetAt,
    engineUsed: "memory-map",
  };
}
