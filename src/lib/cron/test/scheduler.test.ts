import { describe, it, expect } from "bun:test";
import { registerCronJob } from "../scheduler";

describe("scheduler", () => {
  it("should register cron job and return stop function", () => {
    let executed = false;
    const job = registerCronJob("0 * * * *", 100000, "test-job", () => {
      executed = true;
    });

    expect(job).toBeDefined();
    expect(job.name).toBe("test-job");
    expect(["bun-cron", "fallback-interval"]).toContain(job.engineUsed);
    expect(typeof job.stop).toBe("function");

    job.stop();
    expect(executed).toBe(false);
  });
});
