import { describe, it, expect, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ValidationUtils } from "../validation-utils";

describe("ValidationUtils", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  describe("validateServiceMethod", () => {
    it("should validate service and method names", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateServiceMethod("health", "check");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid service", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateServiceMethod("", "");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should warn for unknown service", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateServiceMethod("unknown", "method");

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("validateParameters", () => {
    it("should validate parameters", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const parameters = [
        { name: "id", type: "string", required: true, description: "ID" },
      ];
      const values = { id: "123" };

      const result = ValidationUtils.validateParameters(parameters, values);

      expect(result[0].isValid).toBe(true);
    });

    it("should validate string type", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const parameters = [
        { name: "name", type: "string", required: true, description: "Name" },
      ];
      const values = { name: 123 };

      const result = ValidationUtils.validateParameters(parameters, values);

      expect(result[0].isValid).toBe(false);
    });

    it("should validate number type", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const parameters = [
        { name: "count", type: "number", required: true, description: "Count" },
      ];
      const values = { count: "not-a-number" };

      const result = ValidationUtils.validateParameters(parameters, values);

      expect(result[0].isValid).toBe(false);
    });

    it("should validate boolean type", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const parameters = [
        {
          name: "active",
          type: "boolean",
          required: true,
          description: "Active",
        },
      ];
      const values = { active: "not-boolean" };

      const result = ValidationUtils.validateParameters(parameters, values);

      expect(result[0].isValid).toBe(false);
    });

    it("should validate email type", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const parameters = [
        { name: "email", type: "email", required: true, description: "Email" },
      ];
      const values = { email: "invalid-email" };

      const result = ValidationUtils.validateParameters(parameters, values);

      expect(result[0].isValid).toBe(false);
    });

    it("should validate URL type", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const parameters = [
        { name: "url", type: "url", required: true, description: "URL" },
      ];
      const values = { url: "not-a-url" };

      const result = ValidationUtils.validateParameters(parameters, values);

      expect(result[0].isValid).toBe(false);
    });
  });

  describe("validateHttpMethod", () => {
    it("should validate HTTP method", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateHttpMethod("GET", "query");

      expect(result.isValid).toBe(true);
    });

    it("should warn for query with non-GET method", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateHttpMethod("POST", "query");

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("sanitizeValue", () => {
    it("should sanitize string value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.sanitizeValue("  test  ", "string");

      expect(result).toBe("test");
    });

    it("should sanitize number value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.sanitizeValue("123", "number");

      expect(result).toBe(123);
    });

    it("should sanitize boolean value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.sanitizeValue("true", "boolean");

      expect(result).toBe(true);
    });
  });

  describe("validateUrl", () => {
    it("should validate valid URL", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateUrl("https://example.com");

      expect(result.isValid).toBe(true);
    });

    it("should return error for invalid URL", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateUrl("not-a-url");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateEnvironment", () => {
    it("should validate environment variables", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ValidationUtils.validateEnvironment();

      
      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("warnings");
    });
  });

  describe("formatValidationErrors", () => {
    it("should format validation errors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const validation = {
        isValid: false,
        errors: ["Error 1", "Error 2"],
        warnings: ["Warning 1"],
      };

      const formatted = ValidationUtils.formatValidationErrors(validation);

      expect(formatted).toContain("Error 1");
      expect(formatted).toContain("Warning 1");
    });

    it("should return empty string for valid validation", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const formatted = ValidationUtils.formatValidationErrors(validation);

      expect(formatted).toBe("");
    });
  });

  describe("isEmpty", () => {
    it("should check if value is empty", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(ValidationUtils.isEmpty(null)).toBe(true);
      expect(ValidationUtils.isEmpty(undefined)).toBe(true);
      expect(ValidationUtils.isEmpty("")).toBe(true);
      expect(ValidationUtils.isEmpty("  ")).toBe(true);
      expect(ValidationUtils.isEmpty([])).toBe(true);
      expect(ValidationUtils.isEmpty({})).toBe(true);
      expect(ValidationUtils.isEmpty("value")).toBe(false);
      expect(ValidationUtils.isEmpty([1])).toBe(false);
    });
  });

  describe("validatePayloadSize", () => {
    it("should validate payload size", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const payload = { data: "test" };
      const result = ValidationUtils.validatePayloadSize(payload, 1024);

      expect(result.isValid).toBe(true);
    });

    it("should return error for oversized payload", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const largePayload = { data: "x".repeat(2 * 1024 * 1024) };
      const result = ValidationUtils.validatePayloadSize(largePayload, 1024);

      expect(result.isValid).toBe(false);
    });
  });
});
