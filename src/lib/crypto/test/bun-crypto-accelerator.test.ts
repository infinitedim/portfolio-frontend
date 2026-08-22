import { describe, it, expect } from "bun:test";
import { fastHashString, fastVerifyHash } from "../bun-crypto-accelerator";

describe("bun-crypto-accelerator", () => {
  it("should generate non-empty hex hash string", () => {
    const res = fastHashString("portfolio-secret-payload");
    expect(res.hashHex).toBeDefined();
    expect(res.hashHex.length).toBeGreaterThan(0);
    expect(["bun-hash", "web-crypto"]).toContain(res.engineUsed);
  });

  it("should verify deterministic hashes", () => {
    const input = "handshake-token-123";
    const res = fastHashString(input);
    const isValid = fastVerifyHash(input, res.hashHex);
    expect(isValid).toBe(true);
  });
});
