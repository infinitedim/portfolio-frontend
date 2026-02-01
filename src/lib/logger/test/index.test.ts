/**
 * Logger index exports test
 * Uses importActual because setup mocks @/lib/logger (same module as ../index).
 */
import { describe, it, expect, vi } from "vitest";

describe("logger index exports", () => {
  it("should export clientLogger, serverLogger, createServerLogger, ServerLogger, ClientLogger", async () => {
    const logger =
      await vi.importActual<typeof import("../index")>("@/lib/logger");
    expect(logger.clientLogger).toBeDefined();
    expect(logger.ClientLogger).toBeDefined();
    expect(logger.serverLogger).toBeDefined();
    expect(logger.createServerLogger).toBeTypeOf("function");
    expect(logger.ServerLogger).toBeDefined();
  });

  it("should export initWebVitals, reportWebVitals, getWebVitalsSummary", async () => {
    const logger =
      await vi.importActual<typeof import("../index")>("@/lib/logger");
    expect(logger.initWebVitals).toBeTypeOf("function");
    expect(logger.reportWebVitals).toBeTypeOf("function");
    expect(logger.getWebVitalsSummary).toBeTypeOf("function");
  });

  it("should export LogLevel", async () => {
    const logger =
      await vi.importActual<typeof import("../index")>("@/lib/logger");
    expect(logger.LogLevel).toBeDefined();
    expect(logger.LogLevel.INFO).toBe("info");
  });

  it("should export config (clientConfig, serverConfig, etc.)", async () => {
    const logger =
      await vi.importActual<typeof import("../index")>("@/lib/logger");
    expect(logger.clientConfig).toBeDefined();
    expect(logger.serverConfig).toBeDefined();
    expect(logger.PII_PATTERNS).toBeDefined();
    expect(logger.SENSITIVE_HEADERS).toBeDefined();
    expect(logger.SENSITIVE_FIELDS).toBeDefined();
  });

  it("should export utils (maskPII, formatError, isClient, isServer, etc.)", async () => {
    const logger =
      await vi.importActual<typeof import("../index")>("@/lib/logger");
    expect(logger.maskPII).toBeTypeOf("function");
    expect(logger.maskPIIString).toBeTypeOf("function");
    expect(logger.formatError).toBeTypeOf("function");
    expect(logger.isClient).toBeTypeOf("function");
    expect(logger.isServer).toBeTypeOf("function");
  });
});
