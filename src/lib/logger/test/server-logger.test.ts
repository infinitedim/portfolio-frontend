import { describe, it, expect, beforeEach, jest } from "bun:test";
import { createServerLogger, ServerLogger } from "../server-logger";
import { LogLevel } from "../types";

describe("createServerLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  it("should return a ServerLogger instance", () => {
    const logger = createServerLogger();
    expect(logger).toBeInstanceOf(ServerLogger);
  });

  it("should not throw when calling log methods (disabled in jsdom)", () => {
    const logger = createServerLogger();
    expect(() => logger.trace("trace")).not.toThrow();
    expect(() => logger.debug("debug")).not.toThrow();
    expect(() => logger.info("info")).not.toThrow();
    expect(() => logger.warn("warn")).not.toThrow();
    expect(() => logger.error("error")).not.toThrow();
    expect(() => logger.fatal("fatal")).not.toThrow();
  });

  it("should not throw when calling logHttp", () => {
    const logger = createServerLogger();
    expect(() => logger.logHttp("GET", "/api", 200, 10)).not.toThrow();
  });

  it("should not throw when calling logRequest", () => {
    const logger = createServerLogger();
    expect(() =>
      logger.logRequest("GET", "http://localhost/", {}),
    ).not.toThrow();
  });

  it("should not throw when calling logResponse", () => {
    const logger = createServerLogger();
    expect(() => logger.logResponse("GET", "/api", 200, 5)).not.toThrow();
  });

  it("should not throw when calling logClientLogs", () => {
    const logger = createServerLogger();
    expect(() =>
      logger.logClientLogs([
        {
          timestamp: new Date().toISOString(),
          level: LogLevel.INFO,
          message: "test",
        },
      ]),
    ).not.toThrow();
  });
});
