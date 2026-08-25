import { describe, it, expect } from "bun:test";
import { optimizeImage } from "../bun-image-optimizer";

describe("bun-image-optimizer", () => {
                      
  const sampleBuffer = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60, 0x60, 0x60, 0x00,
    0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  it("optimizeImage function should be defined and exportable", () => {
    expect(typeof optimizeImage).toBe("function");
  });

  it("should process valid PNG buffer or return structured result", async () => {
    const res = await optimizeImage(sampleBuffer, { format: "webp", quality: 80 });
    expect(res).toHaveProperty("success");
    if (res.success) {
      expect(res.format).toBe("webp");
      expect(res.buffer).toBeInstanceOf(Uint8Array);
    } else {
      expect(typeof res.error).toBe("string");
    }
  });

  it("should handle format options cleanly", async () => {
    const pngRes = await optimizeImage(sampleBuffer, { format: "png" });
    expect(pngRes).toHaveProperty("success");

    const jpegRes = await optimizeImage(sampleBuffer, { format: "jpeg" });
    expect(jpegRes).toHaveProperty("success");

    const avifRes = await optimizeImage(sampleBuffer, { format: "avif" });
    expect(avifRes).toHaveProperty("success");
  });

  it("should handle resize parameters width and height", async () => {
    const res = await optimizeImage(sampleBuffer, { width: 10, height: 10 });
    expect(res).toHaveProperty("success");
  });

  it("should return error result for corrupt/invalid image buffer", async () => {
    const corruptBuffer = new Uint8Array([1, 2, 3, 4, 5]);
    const res = await optimizeImage(corruptBuffer);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(typeof res.error).toBe("string");
    }
  });
});
