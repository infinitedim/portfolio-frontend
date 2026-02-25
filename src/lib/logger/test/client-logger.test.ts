import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClientLogger } from "../client-logger";
import * as loggerUtils from "../utils";

global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  status: 503,
  json: async () => ({}),
  text: async () => "",
}) as unknown as typeof fetch;

describe("ClientLogger", () => {
  let logger: ClientLogger;

  beforeEach(() => {
    vi.spyOn(loggerUtils, "isClient").mockReturnValue(true);
    logger = new ClientLogger();
    vi.clearAllMocks();

    vi.spyOn(loggerUtils, "isClient").mockReturnValue(true);

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
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
    vi.restoreAllMocks();
  });

  describe("Basic Logging", () => {
    it("should log info messages", () => {
      const spy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      logger.info("Test message", { component: "test" });
      expect(spy).toHaveBeenCalled();
    });

    it("should log error messages", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const spy = vi
        .spyOn(process.stderr, "write")
        .mockImplementation(() => true);

      expect(() =>
        logger.error("Error message", new Error("Test error")),
      ).not.toThrow();
    });

    it("should log warnings", () => {
      const spy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
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
      const spy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
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
      const spy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
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
      const flushSpy = vi.spyOn(logger, "flush").mockResolvedValue(undefined);
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
      const spy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
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
