import { describe, it, expect } from "bun:test";
import { optimizeImage } from "../bun-image-optimizer";

// 1x1 transparent PNG buffer for testing
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const samplePngBuffer = Uint8Array.from(Buffer.from(SAMPLE_PNG_BASE64, "base64"));

describe("bun-image-optimizer", () => {
  it("optimizeImage function should be defined and exportable", () => {
    expect(optimizeImage).toBeDefined();
    expect(typeof optimizeImage).toBe("function");
  });

  it("should process valid PNG buffer and convert to WebP format", async () => {
    const result = await optimizeImage(samplePngBuffer, {
      format: "webp",
      quality: 80,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buffer).toBeInstanceOf(Uint8Array);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.format).toBe("webp");
      expect(["bun-image", "sharp"]).toContain(result.engineUsed);
    }
  });

  it("should support resize parameters width and height", async () => {
    const result = await optimizeImage(samplePngBuffer, {
      width: 10,
      height: 10,
      format: "png",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.format).toBe("png");
      expect(result.width).toBe(10);
      expect(result.height).toBe(10);
    }
  });

  it("should return error result for corrupt/invalid image buffer", async () => {
    const invalidBuffer = new Uint8Array([1, 2, 3, 4, 5]);
    const result = await optimizeImage(invalidBuffer, { format: "webp" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe("string");
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});
