/**
 * Utils index exports test
 */
import { describe, it, expect } from "vitest";
import * as utils from "../index";

describe("lib/utils index exports", () => {
  it("should export ArgumentParser (from arg-parser)", () => {
    expect(utils.ArgumentParser).toBeDefined();
  });

  it("should export from bundler-optimization", () => {
    expect(utils).toHaveProperty("analyzeBundleSize");
    expect(utils).toHaveProperty("initBundleOptimizations");
  });

  it("should export from theme-display", () => {
    expect(utils).toHaveProperty("ThemeDisplay");
  });

  it("should export from utils (generateId, etc.)", () => {
    expect(utils.generateId).toBeTypeOf("function");
  });
});
