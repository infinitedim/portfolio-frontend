export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
  engineUsed: "memory-map";
}

                                                            
const memoryMapFallback = new Map<string, { count: number; resetAt: number }>();

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
