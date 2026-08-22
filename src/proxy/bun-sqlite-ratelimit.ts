export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
  engineUsed: "bun-sqlite" | "memory-map";
}

interface SqlitePreparedStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
}

interface SqliteDatabaseInstance {
  exec(sql: string): void;
  prepare(sql: string): SqlitePreparedStatement;
}

let dbInstance: SqliteDatabaseInstance | null = null;
let isSqliteAvailable = false;

try {
  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun;
  if (bunGlobal && typeof bunGlobal === "object") {
    // Dynamic import bun:sqlite in Bun environment
    const sqliteModule = require("bun:sqlite");
    const Database = sqliteModule.Database || sqliteModule.default;
    if (Database) {
      dbInstance = new Database(":memory:") as SqliteDatabaseInstance;
      dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS ratelimit (
          ip TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_ratelimit_reset ON ratelimit(reset_at);
      `);
      isSqliteAvailable = true;
    }
  }
} catch {
  isSqliteAvailable = false;
  dbInstance = null;
}

// In-memory map fallback for Node.js / Vercel Edge
const memoryMapFallback = new Map<string, { count: number; resetAt: number }>();

export function checkSqliteRateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000,
): RateLimitResult {
  const now = Date.now();
  const resetAt = now + windowMs;

  if (isSqliteAvailable && dbInstance) {
    try {
      // Purge expired records atomically
      const purgeStmt = dbInstance.prepare("DELETE FROM ratelimit WHERE reset_at < ?");
      purgeStmt.run(now);

      // Check current IP
      const selectStmt = dbInstance.prepare(
        "SELECT count, reset_at FROM ratelimit WHERE ip = ?",
      );
      const row = selectStmt.get(ip) as { count: number; reset_at: number } | undefined;

      if (!row) {
        const insertStmt = dbInstance.prepare(
          "INSERT INTO ratelimit (ip, count, reset_at) VALUES (?, 1, ?)",
        );
        insertStmt.run(ip, resetAt);
        return {
          allowed: true,
          count: 1,
          remaining: limit - 1,
          resetAt,
          engineUsed: "bun-sqlite",
        };
      }

      if (row.count >= limit) {
        return {
          allowed: false,
          count: row.count,
          remaining: 0,
          resetAt: row.reset_at,
          engineUsed: "bun-sqlite",
        };
      }

      const newCount = row.count + 1;
      const updateStmt = dbInstance.prepare(
        "UPDATE ratelimit SET count = ? WHERE ip = ?",
      );
      updateStmt.run(newCount, ip);

      return {
        allowed: true,
        count: newCount,
        remaining: Math.max(0, limit - newCount),
        resetAt: row.reset_at,
        engineUsed: "bun-sqlite",
      };
    } catch {
      // Fall through to memory map fallback on SQLite error
    }
  }

  // Memory map fallback
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
