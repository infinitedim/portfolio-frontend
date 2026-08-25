import { describe, it, expect } from "bun:test";
import { createServerLogger } from "../server-logger";
import type { LogLevel } from "../types";

describe("logger/server-logger", () => {
  it("createServerLogger should create logger with component context", () => {
    const logger = createServerLogger("TestComponent");
    expect(logger).toBeDefined();
  });

  it("should log trace, debug, info, warn, error, and fatal messages without throwing", () => {
    const logger = createServerLogger("LoggingTest");

    expect(() => {
      logger.trace("trace message", { test: true });
      logger.debug("debug message", { test: true });
      logger.info("info message", { test: true });
      logger.warn("warn message", { test: true });
      logger.error("error message", new Error("Sample Error"), { test: true });
      logger.fatal("fatal message", new Error("Fatal Error"), { test: true });
    }).not.toThrow();
  });

  it("logHttp, logRequest, and logResponse should record HTTP metrics", () => {
    const logger = createServerLogger("HttpTest");

    expect(() => {
      logger.logHttp("GET", "/api/test", 200, 15, { path: "/api/test" });
      logger.logHttp("POST", "/api/fail", 500, 120, { path: "/api/fail" });
      logger.logRequest("GET", "http://localhost:3000/api/users", { authorization: "Bearer secret" });
      logger.logResponse("GET", "/api/users", 200, 25);
    }).not.toThrow();
  });

  it("logClientLogs should process batch client log entries", () => {
    const logger = createServerLogger("ClientIngestTest");

    expect(() => {
      logger.logClientLogs(
        [
          {
            timestamp: new Date().toISOString(),
            level: "info" as LogLevel,
            message: "Client page view",
          },
          {
            timestamp: new Date().toISOString(),
            level: "error" as LogLevel,
            message: "Client script error",
          },
        ],
        { browser: "Chrome" },
      );
    }).not.toThrow();
  });
});
