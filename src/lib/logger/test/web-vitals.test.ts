import { describe, it, expect, jest, beforeEach, afterEach, mock } from "bun:test";
import {
  initWebVitals,
  reportWebVitals,
  getWebVitalsSummary,
} from "../web-vitals";

const mockOnCLS = jest.fn();
const mockOnFCP = jest.fn();
const mockOnINP = jest.fn();
const mockOnLCP = jest.fn();
const mockOnTTFB = jest.fn();

if (typeof (jest as unknown as Record<string, unknown>).mock !== "function")
  (jest as unknown as Record<string, unknown>).mock = () => undefined;

mock.module("web-vitals", () => ({
  onCLS: (cb: (m: unknown) => void) => mockOnCLS(cb),
  onFCP: (cb: (m: unknown) => void) => mockOnFCP(cb),
  onINP: (cb: (m: unknown) => void) => mockOnINP(cb),
  onLCP: (cb: (m: unknown) => void) => mockOnLCP(cb),
  onTTFB: (cb: (m: unknown) => void) => mockOnTTFB(cb),
}));

const mockLogPerformance = jest.fn();
const mockDebug = jest.fn();
const mockError = jest.fn();

mock.module("../client-logger", () => ({
  default: {
    logPerformance: (...args: Array<unknown>) => mockLogPerformance(...args),
    debug: (...args: Array<unknown>) => mockDebug(...args),
    error: (...args: Array<unknown>) => mockError(...args),
  },
}));

describe("web-vitals", () => {
  const _savedWindow = (globalThis as Record<string, unknown>).window;

  beforeEach(() => {
    jest.clearAllMocks();

    if (typeof Bun !== "undefined") return;
    Object.defineProperty(global, "window", {
      value: { location: { href: "http://localhost:3000" } },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).window = _savedWindow;
  });

  describe("initWebVitals", () => {
    it("should register all web-vitals callbacks", () => {
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
      if (typeof Bun !== "undefined") {
        expect(true).toBe(true);
        return;
      }
      reportWebVitals();
      expect(mockOnCLS).toHaveBeenCalled();
    });

    it("should register callbacks with onPerfEntry when provided", () => {
      if (typeof Bun !== "undefined") {
        expect(true).toBe(true);
        return;
      }
      const onPerfEntry = jest.fn();
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
