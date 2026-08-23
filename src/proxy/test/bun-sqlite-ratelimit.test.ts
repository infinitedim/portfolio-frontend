import { describe, it, expect } from "bun:test";
import { checkSqliteRateLimit } from "../bun-sqlite-ratelimit";

describe("bun-sqlite-ratelimit", () => {
  it("should allow requests under the limit", () => {
    const res = checkSqliteRateLimit("192.168.1.200", 5, 60000);
    expect(res.allowed).toBe(true);
    expect(res.count).toBe(1);
    expect(res.remaining).toBe(4);
    expect(res.engineUsed).toBe("memory-map");
  });

  it("should block requests when limit is exceeded", () => {
    const ip = "192.168.1.201";
    for (let i = 0; i < 3; i++) {
      checkSqliteRateLimit(ip, 3, 60000);
    }
    const blockedRes = checkSqliteRateLimit(ip, 3, 60000);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });
});
