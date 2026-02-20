

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  clientConfig,
  serverConfig,
  PII_PATTERNS,
  SENSITIVE_HEADERS,
  SENSITIVE_FIELDS,
  LOG_PATHS,
  ROTATION_CONFIG,
  SAMPLING_CONFIG,
  PERFORMANCE_THRESHOLDS,
} from "../config";
import { LogLevel } from "../types";

describe("logger config", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  describe("clientConfig", () => {
    it("should have required LoggerConfig shape", () => {
      expect(clientConfig).toHaveProperty("level");
      expect(clientConfig).toHaveProperty("pretty");
      expect(clientConfig).toHaveProperty("environment");
      expect(clientConfig).toHaveProperty("console", true);
      expect(clientConfig).toHaveProperty("file", false);
      expect(clientConfig).toHaveProperty("remote");
      expect(clientConfig).toHaveProperty("maskPII", true);
      expect(clientConfig).toHaveProperty("apiEndpoint");
      expect(clientConfig).toHaveProperty("batch");
    });

    it("should have level as valid LogLevel", () => {
      expect(Object.values(LogLevel)).toContain(clientConfig.level);
    });

    it("should have batch config with expected keys", () => {
      expect(clientConfig.batch).toBeDefined();
      expect(clientConfig.batch).toHaveProperty("maxBatchSize");
      expect(clientConfig.batch).toHaveProperty("maxBatchWait");
      expect(clientConfig.batch).toHaveProperty("maxRetries");
      expect(clientConfig.batch).toHaveProperty("retryDelay");
    });
  });

  describe("serverConfig", () => {
    it("should have required LoggerConfig shape", () => {
      expect(serverConfig).toHaveProperty("level");
      expect(serverConfig).toHaveProperty("pretty");
      expect(serverConfig).toHaveProperty("environment");
      expect(serverConfig).toHaveProperty("console", true);
      expect(serverConfig).toHaveProperty("maskPII", true);
    });
  });

  describe("PII_PATTERNS", () => {
    it("should have email, phone, creditCard, ssn, ipv4 patterns", () => {
      expect(PII_PATTERNS.email).toBeInstanceOf(RegExp);
      expect(PII_PATTERNS.phone).toBeInstanceOf(RegExp);
      expect(PII_PATTERNS.creditCard).toBeInstanceOf(RegExp);
      expect(PII_PATTERNS.ssn).toBeInstanceOf(RegExp);
      expect(PII_PATTERNS.ipv4).toBeInstanceOf(RegExp);
    });
  });

  describe("SENSITIVE_HEADERS", () => {
    it("should include authorization and cookie", () => {
      expect(SENSITIVE_HEADERS).toContain("authorization");
      expect(SENSITIVE_HEADERS).toContain("cookie");
    });
  });

  describe("SENSITIVE_FIELDS", () => {
    it("should include password and token", () => {
      expect(SENSITIVE_FIELDS).toContain("password");
      expect(SENSITIVE_FIELDS).toContain("token");
    });
  });

  describe("LOG_PATHS", () => {
    it("should have combined, error, access paths", () => {
      expect(LOG_PATHS.combined).toContain("combined.log");
      expect(LOG_PATHS.error).toContain("error.log");
      expect(LOG_PATHS.access).toContain("access.log");
    });
  });

  describe("ROTATION_CONFIG", () => {
    it("should have maxSize, maxFiles, compress", () => {
      expect(ROTATION_CONFIG.maxSize).toBeDefined();
      expect(ROTATION_CONFIG.maxFiles).toBeDefined();
      expect(ROTATION_CONFIG.compress).toBeDefined();
    });
  });

  describe("SAMPLING_CONFIG", () => {
    it("should have debug, info, warn, error, fatal", () => {
      expect(SAMPLING_CONFIG.debug).toBeGreaterThanOrEqual(0);
      expect(SAMPLING_CONFIG.info).toBe(1.0);
      expect(SAMPLING_CONFIG.warn).toBe(1.0);
      expect(SAMPLING_CONFIG.error).toBe(1.0);
      expect(SAMPLING_CONFIG.fatal).toBe(1.0);
    });
  });

  describe("PERFORMANCE_THRESHOLDS", () => {
    it("should have slow and critical thresholds in ms", () => {
      expect(PERFORMANCE_THRESHOLDS.slow).toBe(1000);
      expect(PERFORMANCE_THRESHOLDS.critical).toBe(5000);
    });
  });
});
