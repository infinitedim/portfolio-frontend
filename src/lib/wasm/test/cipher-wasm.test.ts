import { describe, it, expect } from "bun:test";
import { decodeCipherSecret } from "../cipher-wasm";

describe("cipher-wasm", () => {
  it("should return empty string for empty input", async () => {
    const res = await decodeCipherSecret("");
    expect(res.decoded).toBe("");
  });

  it("should decode hex encoded payload correctly", async () => {
    const sampleHex = Buffer.from("yourblooo_secret_key").toString("hex");
    const res = await decodeCipherSecret(sampleHex);
    expect(res.decoded).toBe("yourblooo_secret_key");
    expect(["rust-wasm", "js-fallback"]).toContain(res.engineUsed);
  });
});
