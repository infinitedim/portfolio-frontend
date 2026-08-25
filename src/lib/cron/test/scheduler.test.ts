import { describe, it, expect } from "bun:test";
import { registerCronJob } from "../scheduler";

describe("cron/scheduler", () => {
  it("should register fallback interval job and stop cleanly", (done) => {
    const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
      | { cron?: unknown }
      | undefined;
    const originalCron = bunGlobal?.cron;
    if (bunGlobal) bunGlobal.cron = undefined;

    try {
      let count = 0;
      const job = registerCronJob("*/1 * * * *", 50, "test-job", () => {
        count++;
      });

      expect(job.name).toBe("test-job");
      expect(job.engineUsed).toBe("fallback-interval");

      setTimeout(() => {
        job.stop();
        expect(count).toBeGreaterThan(0);
        done();
      }, 120);
    } finally {
      if (bunGlobal) bunGlobal.cron = originalCron;
    }
  });

  it("should use native Bun.cron when present on globalThis.Bun", () => {
    const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
      | { cron?: (expr: string, cb: () => void) => void }
      | undefined;

    if (!bunGlobal) return;

    const originalCron = bunGlobal.cron;
    let registeredExpr = "";

    bunGlobal.cron = (expr: string) => {
      registeredExpr = expr;
    };

    try {
      const job = registerCronJob("0 * * * *", 1000, "bun-job", () => {});
      expect(job.engineUsed).toBe("bun-cron");
      expect(registeredExpr).toBe("0 * * * *");
      job.stop();
    } finally {
      bunGlobal.cron = originalCron;
    }
  });
});
