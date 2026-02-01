/**
 * Web Vitals tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global, "window", {
      value: { location: { href: "http://localhost:3000" } },
      writable: true,
    });
  });

  describe("initWebVitals", () => {
    it("should register all web-vitals callbacks", () => {
      initWebVitals();
      expect(mockOnCLS).toHaveBeenCalled();
      expect(mockOnFCP).toHaveBeenCalled();
      expect(mockOnINP).toHaveBeenCalled();
      expect(mockOnLCP).toHaveBeenCalled();
      expect(mockOnTTFB).toHaveBeenCalled();
    });

    it("should call clientLogger.debug on init", () => {
      initWebVitals();
      expect(mockDebug).toHaveBeenCalledWith(
        "Web Vitals monitoring initialized",
        expect.any(Object),
      );
    });
  });

  describe("reportWebVitals", () => {
    it("should call initWebVitals when onPerfEntry is not provided", () => {
      reportWebVitals();
      expect(mockOnCLS).toHaveBeenCalled();
    });

    it("should register callbacks with onPerfEntry when provided", () => {
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
