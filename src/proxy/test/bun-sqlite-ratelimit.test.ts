import { describe, it, expect } from "bun:test";
import { checkSqliteRateLimit } from "../bun-sqlite-ratelimit";

describe("bun-sqlite-ratelimit", () => {
  it("should allow requests under the limit", () => {
    const res = checkSqliteRateLimit("192.168.1.100", 5, 60000);
    expect(res.allowed).toBe(true);
    expect(res.count).toBe(1);
    expect(res.remaining).toBe(4);
    expect(["bun-sqlite", "memory-map"]).toContain(res.engineUsed);
  });

  it("should block requests when limit is exceeded", () => {
    const ip = "192.168.1.101";
    for (let i = 0; i < 3; i++) {
      checkSqliteRateLimit(ip, 3, 60000);
    }
    const blockedRes = checkSqliteRateLimit(ip, 3, 60000);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });
});
