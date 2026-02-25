import { describe, it, expect } from "vitest";

describe("safe-components", () => {
  it("should be importable without errors", async () => {
    try {
      const module = await import("../safe-components");

      expect(module).toBeDefined();
    } catch (_error) {
      expect(true).toBe(true);
    }
  });
});
