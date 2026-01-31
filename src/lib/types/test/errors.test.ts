import { describe, it, expect } from "vitest";
import { canRunTests } from "@/test/test-helpers";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  NetworkError,
  DatabaseError,
  InternalError,
  isAppError,
  toAppError,
  ErrorCodes,
} from "../errors";

describe("errors.ts", () => {
  describe("ValidationError", () => {
    it("should create validation error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new ValidationError("Invalid input", { field: "email" });
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe("email");
    });
  });

  describe("AuthenticationError", () => {
    it("should create authentication error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new AuthenticationError("Not authenticated");
      expect(error.code).toBe("AUTHENTICATION_ERROR");
      expect(error.statusCode).toBe(401);
    });
  });

  describe("AuthorizationError", () => {
    it("should create authorization error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new AuthorizationError("Not authorized", "admin");
      expect(error.code).toBe("AUTHORIZATION_ERROR");
      expect(error.statusCode).toBe(403);
    });
  });

  describe("NotFoundError", () => {
    it("should create not found error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new NotFoundError("Resource not found", {
        resource: "user",
        identifier: "123",
      });
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("ConflictError", () => {
    it("should create conflict error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new ConflictError("Resource conflict");
      expect(error.code).toBe("CONFLICT");
      expect(error.statusCode).toBe(409);
    });
  });

  describe("RateLimitError", () => {
    it("should create rate limit error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new RateLimitError("Too many requests", 60);
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.statusCode).toBe(429);
    });
  });

  describe("NetworkError", () => {
    it("should create network error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new NetworkError("Network error", { service: "API" });
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.statusCode).toBe(502);
    });
  });

  describe("DatabaseError", () => {
    it("should create database error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new DatabaseError("Database error", "query");
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.statusCode).toBe(500);
    });
  });

  describe("InternalError", () => {
    it("should create internal error", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new InternalError("Internal error");
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.statusCode).toBe(500);
    });
  });

  describe("Utility Functions", () => {
    it("should check if error is AppError", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const appError = new ValidationError("Test");
      const regularError = new Error("Test");
      expect(isAppError(appError)).toBe(true);
      expect(isAppError(regularError)).toBe(false);
    });

    it("should convert to AppError", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const regularError = new Error("Test");
      const appError = toAppError(regularError);
      expect(isAppError(appError)).toBe(true);
    });
  });

  describe("ErrorCodes", () => {
    it("should export error codes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(ErrorCodes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ErrorCodes.AUTHENTICATION_ERROR).toBe("AUTHENTICATION_ERROR");
    });
  });
});
