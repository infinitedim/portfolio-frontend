export interface RegisteredCronJob {
  name: string;
  expression: string;
  engineUsed: "bun-cron" | "fallback-interval";
  stop(): void;
}

interface BunCronGlobal {
  cron?(expression: string, callback: () => void): void;
}

/**
 * Registers an in-process cron job using Bun.cron() when available,
 * with graceful fallback to setInterval for Node.js / Vercel.
 */
export function registerCronJob(
  expression: string,
  intervalMs: number,
  jobName: string,
  callback: () => void,
): RegisteredCronJob {
  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { cron?: BunCronGlobal["cron"] }
    | undefined;

  // Try native Bun.cron()
  if (bunGlobal && typeof bunGlobal.cron === "function") {
    try {
      bunGlobal.cron(expression, callback);
      return {
        name: jobName,
        expression,
        engineUsed: "bun-cron",
        stop() {
          // Native Bun cron registration active
        },
      };
    } catch {
      // Fall through to setInterval on invalid cron expression or error
    }
  }

  // Graceful fallback to setInterval
  const timer = setInterval(() => {
    try {
      callback();
    } catch {
      // Ignore unhandled errors in periodic background job
    }
  }, intervalMs);

  return {
    name: jobName,
    expression,
    engineUsed: "fallback-interval",
    stop() {
      clearInterval(timer);
    },
  };
}
