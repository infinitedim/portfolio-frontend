import { describe, it, expect, mock } from "bun:test";
import { initWebVitals, reportWebVitals, getWebVitalsSummary } from "../web-vitals";

mock.module("web-vitals", () => ({
  onCLS: (cb: (m: unknown) => void) =>
    cb({ name: "CLS", value: 0.05, rating: "good", id: "cls-1", navigationType: "navigate" }),
  onFCP: (cb: (m: unknown) => void) =>
    cb({ name: "FCP", value: 1200, rating: "good", id: "fcp-1", navigationType: "navigate" }),
  onINP: (cb: (m: unknown) => void) =>
    cb({ name: "INP", value: 150, rating: "good", id: "inp-1", navigationType: "navigate" }),
  onLCP: (cb: (m: unknown) => void) =>
    cb({ name: "LCP", value: 2100, rating: "good", id: "lcp-1", navigationType: "navigate" }),
  onTTFB: (cb: (m: unknown) => void) =>
    cb({ name: "TTFB", value: 500, rating: "good", id: "ttfb-1", navigationType: "navigate" }),
}));

describe("logger/web-vitals", () => {
  it("initWebVitals should register metrics and update summary store", () => {
    initWebVitals();
    const summary = getWebVitalsSummary();

    expect(summary.metrics.CLS).toBe(0.05);
    expect(summary.metrics.LCP).toBe(2100);
    expect(summary.ratings.LCP).toBe("good");
  });

  it("reportWebVitals with callback should trigger callback for each metric", () => {
    const collected: Array<string> = [];
    reportWebVitals((m) => {
      collected.push(m.name);
    });

    expect(collected).toContain("CLS");
    expect(collected).toContain("LCP");
    expect(collected).toContain("INP");
  });
});
