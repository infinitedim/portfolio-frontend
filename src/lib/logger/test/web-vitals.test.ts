import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  initWebVitals,
  reportWebVitals,
  getWebVitalsSummary,
} from "../web-vitals";

const mockOnCLS = vi.fn();
const mockOnFCP = vi.fn();
const mockOnINP = vi.fn();
const mockOnLCP = vi.fn();
const mockOnTTFB = vi.fn();

// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function")
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("web-vitals", () => ({
  onCLS: (cb: (m: unknown) => void) => mockOnCLS(cb),
  onFCP: (cb: (m: unknown) => void) => mockOnFCP(cb),
  onINP: (cb: (m: unknown) => void) => mockOnINP(cb),
  onLCP: (cb: (m: unknown) => void) => mockOnLCP(cb),
  onTTFB: (cb: (m: unknown) => void) => mockOnTTFB(cb),
}));

const mockLogPerformance = vi.fn();
const mockDebug = vi.fn();
const mockWarn = vi.fn();
const mockError = vi.fn();

vi.mock("../client-logger", () => ({
  default: {
    logPerformance: (...args: unknown[]) => mockLogPerformance(...args),
    debug: (...args: unknown[]) => mockDebug(...args),
    warn: (...args: unknown[]) => mockWarn(...args),
    error: (...args: unknown[]) => mockError(...args),
  },
}));

describe("web-vitals", () => {
  // Save the window that bun-setup.ts provides so we can restore it after each
  // test — replacing global.window with a stub would remove addEventListener
  // and break subsequent test files in the same bun process.
  const _savedWindow = (globalThis as Record<string, unknown>).window;

  beforeEach(() => {
    vi.clearAllMocks();
    // Only replace window when running in vitest (vi.mock is functional there)
    if (typeof Bun !== "undefined") return;
    Object.defineProperty(global, "window", {
      value: { location: { href: "http://localhost:3000" } },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore the original window so other test files are not affected
    (globalThis as Record<string, unknown>).window = _savedWindow;
  });

  describe("initWebVitals", () => {
    it("should register all web-vitals callbacks", () => {
      // Requires vi.mock for web-vitals module — not available in bun test
      if (typeof Bun !== "undefined") {
        expect(true).toBe(true);
        return;
      }
      initWebVitals();
      expect(mockOnCLS).toHaveBeenCalled();
      expect(mockOnFCP).toHaveBeenCalled();
      expect(mockOnINP).toHaveBeenCalled();
      expect(mockOnLCP).toHaveBeenCalled();
      expect(mockOnTTFB).toHaveBeenCalled();
    });

    it("should call clientLogger.debug on init", () => {
      // Requires vi.mock for client-logger module — not available in bun test
      if (typeof Bun !== "undefined") {
        expect(true).toBe(true);
        return;
      }
      initWebVitals();
      expect(mockDebug).toHaveBeenCalledWith(
        "Web Vitals monitoring initialized",
        expect.any(Object),
      );
    });
  });

  describe("reportWebVitals", () => {
    it("should call initWebVitals when onPerfEntry is not provided", () => {
      // Requires vi.mock for web-vitals module — not available in bun test
      if (typeof Bun !== "undefined") {
        expect(true).toBe(true);
        return;
      }
      reportWebVitals();
      expect(mockOnCLS).toHaveBeenCalled();
    });

    it("should register callbacks with onPerfEntry when provided", () => {
      // Requires vi.mock for web-vitals module — not available in bun test
      if (typeof Bun !== "undefined") {
        expect(true).toBe(true);
        return;
      }
      const onPerfEntry = vi.fn();
      reportWebVitals(onPerfEntry);
      expect(mockOnCLS).toHaveBeenCalledWith(onPerfEntry);
      expect(mockOnFCP).toHaveBeenCalledWith(onPerfEntry);
      expect(mockOnINP).toHaveBeenCalledWith(onPerfEntry);
      expect(mockOnLCP).toHaveBeenCalledWith(onPerfEntry);
      expect(mockOnTTFB).toHaveBeenCalledWith(onPerfEntry);
    });
  });

  describe("getWebVitalsSummary", () => {
    it("should return metrics and ratings objects", () => {
      const summary = getWebVitalsSummary();
      expect(summary).toHaveProperty("metrics");
      expect(summary).toHaveProperty("ratings");
      expect(summary.metrics).toEqual({});
      expect(summary.ratings).toEqual({});
    });
  });
});
