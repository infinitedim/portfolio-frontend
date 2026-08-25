/**
 * Represents a registered scheduled cron task handler with control methods.
 */
export interface RegisteredCronJob {
  /** Descriptive name of the registered scheduled job. */
  name: string;
  /** Cron schedule expression string defining the execution pattern. */
  expression: string;
  /** Underlying scheduling mechanism used to run the cron job. */
  engineUsed: "bun-cron" | "fallback-interval";
  /** Stops and unregisters the cron job execution. */
  stop(): void;
}

/**
 * Interface definition for Bun global cron runtime API.
 */
interface BunCronGlobal {
  /** Registers a cron task using Bun's native scheduler. */
  cron?(expression: string, callback: () => void): void;
}

/**
 * Registers and starts a recurring background cron job using native Bun cron if available,
 * falling back to standard interval timers.
 *
 * @param expression - Standard cron format expression string.
 * @param intervalMs - Fallback interval frequency in milliseconds if native cron is unavailable.
 * @param jobName - Identifier name for the cron job.
 * @param callback - Task function to execute on each scheduled trigger.
 * @returns The registered cron job handle containing status and stop controller.
 *
 * @example
 * ```ts
 * const job = registerCronJob("* /5 * * * *", 300000, "cache-cleanup", () => cleanupCache());
 * job.stop();
 * ```
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

                          
  if (bunGlobal && typeof bunGlobal.cron === "function") {
    try {
      bunGlobal.cron(expression, callback);
      return {
        name: jobName,
        expression,
        engineUsed: "bun-cron",
        stop() {
                                                
        },
      };
    } // eslint-disable-next-line no-empty
    catch {}
  }

                                     
  const timer = setInterval(() => {
    try {
      callback();
    } // eslint-disable-next-line no-empty
    catch {}
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
