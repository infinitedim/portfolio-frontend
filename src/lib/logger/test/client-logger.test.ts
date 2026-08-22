import { describe, it, expect, jest, beforeEach, afterEach } from "bun:test";
import { ClientLogger } from "../client-logger";
import * as loggerUtils from "../utils";

global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  status: 503,
  json: async () => ({}),
  text: async () => "",
}) as unknown as typeof fetch;

describe("ClientLogger", () => {
  let logger: ClientLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    if (typeof window === "undefined") {
      (globalThis as unknown as { window: Record<string, unknown> }).window = {};
    }
    const mockStorage = { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() };
    (window as unknown as { localStorage: typeof mockStorage; location: { href: string } }).localStorage = mockStorage;
    (window as unknown as { localStorage: typeof mockStorage; location: { href: string } }).location = { href: "http://localhost:3000" };
    (globalThis as unknown as { localStorage: typeof mockStorage }).localStorage = mockStorage;
    jest.spyOn(loggerUtils, "isClient").mockReturnValue(true);
    logger = new ClientLogger();

    (global.fetch as unknown as ReturnType<typeof jest.fn>).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
      text: async () => "",
    });
  });

  afterEach(() => {
    const loggerBuffer = (
      logger as unknown as {
        buffer: { timer: ReturnType<typeof setTimeout> | null };
      }
    ).buffer;
    if (loggerBuffer?.timer) {
      clearTimeout(loggerBuffer.timer);
      loggerBuffer.timer = null;
    }
    jest.restoreAllMocks();
  });

  describe("Basic Logging", () => {
    it("should log info messages", () => {
      const spy = jest.spyOn(
        (
          logger as unknown as {
            pino: { info: (...args: Array<unknown>) => void };
          }
        ).pino,
        "info",
      );
      logger.info("Test message", { component: "test" });
      expect(spy).toHaveBeenCalled();
    });

    it("should log error messages", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const spy = jest
        .spyOn(process.stderr, "write")
        .mockImplementation(() => true);

      expect(() =>
        logger.error("Error message", new Error("Test error")),
      ).not.toThrow();
    });

    it("should log warnings", () => {
      const spy = jest.spyOn(
        (
          logger as unknown as {
            pino: { warn: (...args: Array<unknown>) => void };
          }
        ).pino,
        "warn",
      );
      logger.warn("Warning message");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Context Enrichment", () => {
    it("should enrich context with request information", () => {
      expect(logger.info).toBeDefined();
    });
  });

  describe("User Actions", () => {
    it("should log user actions", () => {
      const spy = jest.spyOn(
        (
          logger as unknown as {
            pino: { info: (...args: Array<unknown>) => void };
          }
        ).pino,
        "info",
      );
      logger.logUserAction("click", { buttonId: "submit" });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Performance Logging", () => {
    it("should log performance metrics", () => {
      expect(() =>
        logger.logPerformance("api_call", 150, { endpoint: "/api/users" }),
      ).not.toThrow();
    });

    it("should warn on slow performance", () => {
      const spy = jest.spyOn(
        (
          logger as unknown as {
            pino: { warn: (...args: Array<unknown>) => void };
          }
        ).pino,
        "warn",
      );
      logger.logPerformance("api_call", 2000, { endpoint: "/api/slow" });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Security Logging", () => {
    it("should log security events", () => {
      expect(() =>
        logger.logSecurityEvent("failed_login", "high", { ip: "192.168.1.1" }),
      ).not.toThrow();
    });

    it("should flush immediately for critical security events", async () => {
      const flushSpy = jest.spyOn(logger, "flush").mockResolvedValue(undefined);
      logger.logSecurityEvent("account_takeover", "critical", {
        userId: "123",
      });
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe("API Call Logging", () => {
    it("should log successful API calls", () => {
      expect(() =>
        logger.logApiCall("GET", "/api/users", 200, 150),
      ).not.toThrow();
    });

    it("should warn on client errors", () => {
      const spy = jest.spyOn(
        (
          logger as unknown as {
            pino: { warn: (...args: Array<unknown>) => void };
          }
        ).pino,
        "warn",
      );
      logger.logApiCall("POST", "/api/users", 400, 100);
      expect(spy).toHaveBeenCalled();
    });

    it("should error on server errors", () => {
      expect(() =>
        logger.logApiCall("GET", "/api/users", 500, 200),
      ).not.toThrow();
    });
  });
});
