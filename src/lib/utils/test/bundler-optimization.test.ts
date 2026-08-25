import { describe, it, expect, beforeEach } from "bun:test";
import {
  prefetchResources,
  optimizeImageLoading,
  dynamicImportWithRetry,
  analyzeBundleSize,
  markUnusedExports,
  addResourceHints,
  optimizeThirdParty,
  initBundleOptimizations,
  SplittingStrategies,
} from "../bundler-optimization";

describe("bundler-optimization", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("prefetchResources and markUnusedExports execute without throwing", () => {
    expect(() => prefetchResources()).not.toThrow();
    expect(() => markUnusedExports()).not.toThrow();
  });

  it("optimizeImageLoading sets loading='lazy' on images", () => {
    const img = document.createElement("img");
    document.body.appendChild(img);

    optimizeImageLoading();
    expect(img.loading).toBe("lazy");
  });

  it("dynamicImportWithRetry retries on failure before succeeding", async () => {
    let attempts = 0;
    const importFn = async () => {
      attempts++;
      if (attempts < 2) throw new Error("Import failed");
      return "Import Success";
    };

    const res = await dynamicImportWithRetry(importFn, 3, 10);
    expect(res).toBe("Import Success");
    expect(attempts).toBe(2);
  });

  it("addResourceHints appends dns-prefetch link elements to document head", () => {
    addResourceHints();
    const link = document.querySelector('link[rel="dns-prefetch"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("https://cdn.jsdelivr.net");
  });

  it("optimizeThirdParty sets defer=true on matching scripts", () => {
    const script = document.createElement("script");
    script.src = "https://cdn.example.com/analytics.js";
    document.body.appendChild(script);

    optimizeThirdParty();
    expect(script.defer).toBe(true);
  });

  it("initBundleOptimizations runs optimizations", () => {
    expect(() => initBundleOptimizations()).not.toThrow();
  });

  it("SplittingStrategies exposes feature and size dynamic imports", () => {
    const byFeature = SplittingStrategies.byFeature();
    expect(byFeature.themes).toBeDefined();

    const bySize = SplittingStrategies.bySize();
    expect(bySize.icons).toBeDefined();
  });

  it("analyzeBundleSize runs safely when performance entries exist", () => {
    expect(() => analyzeBundleSize()).not.toThrow();
  });
});
