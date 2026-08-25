import { describe, it, expect } from "bun:test";
import { decodeCipherSecret } from "../cipher-wasm";

describe("wasm/cipher-wasm", () => {
  it("should return empty decoded result for empty string", async () => {
    const res = await decodeCipherSecret("");
    expect(res.decoded).toBe("");
    expect(res.engineUsed).toBe("js-fallback");
  });

  it("should decode hex encoded string using WASM engine path", async () => {
                             
    const hex = Buffer.from("natas3_secret", "utf-8").toString("hex");
    const res = await decodeCipherSecret(hex);

    expect(res.engineUsed).toBe("rust-wasm");
    expect(res.decoded).toBe("natas3_secret");
  });

  it("should fall back to base64 decoding when hex parsing fails", async () => {
                                                         
    const b64 = Buffer.from("b64_secret_test", "utf-8").toString("base64");
    const res = await decodeCipherSecret(b64);

    expect(res.engineUsed).toBe("js-fallback");
    expect(res.decoded).toBe("b64_secret_test");
  });
});
