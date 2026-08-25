import { describe, it, expect } from "bun:test";
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
} from "../errors";

describe("types/errors", () => {
  it("ValidationError factory helpers and methods", () => {
    const err = ValidationError.fromField("email", "Email is invalid");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
    expect(err.field).toBe("email");
    expect(err.toClientError()).toEqual({
      code: "VALIDATION_ERROR",
      message: "Email is invalid",
      statusCode: 400,
    });
    expect(err.toJSON()).toHaveProperty("timestamp");

    const errConstraints = ValidationError.fromConstraints({
      f1: "Field 1 required",
      f2: "Field 2 required",
    });
    expect(errConstraints.message).toContain("Field 1 required");
  });

  it("AuthenticationError static factory methods", () => {
    expect(AuthenticationError.invalidCredentials().message).toBe("Invalid email or password");
    expect(AuthenticationError.tokenExpired().message).toBe("Token has expired");
    expect(AuthenticationError.tokenInvalid().message).toBe("Invalid token");
    expect(AuthenticationError.sessionExpired().message).toBe("Session has expired");
  });

  it("AuthorizationError static factory methods", () => {
    const permErr = AuthorizationError.insufficientPermissions("write:blog");
    expect(permErr.requiredPermission).toBe("write:blog");
    expect(AuthorizationError.adminRequired().requiredPermission).toBe("admin");
  });

  it("NotFoundError static factory methods", () => {
    const errWithId = NotFoundError.forResource("Project", "proj-123");
    expect(errWithId.message).toContain("Project with id 'proj-123' not found");
    expect(errWithId.resource).toBe("Project");

    const errNoId = NotFoundError.forResource("User");
    expect(errNoId.message).toBe("User not found");
  });

  it("ConflictError static factory methods", () => {
    expect(ConflictError.alreadyExists("User", "email").message).toContain("with this email already exists");
    expect(ConflictError.alreadyExists("User").message).toBe("User already exists");
  });

  it("RateLimitError static factory methods", () => {
    const err = RateLimitError.withRetry(60);
    expect(err.retryAfter).toBe(60);
    expect(err.statusCode).toBe(429);
  });

  it("NetworkError static factory methods", () => {
    const err = NetworkError.fromService("GitHub API");
    expect(err.service).toBe("GitHub API");
    expect(err.statusCode).toBe(502);

    expect(NetworkError.timeout("Resend").message).toContain("Request to Resend timed out");
    expect(NetworkError.timeout().message).toBe("Request timed out");
  });

  it("DatabaseError static factory methods", () => {
    expect(DatabaseError.queryFailed("SELECT").operation).toBe("SELECT");
    expect(DatabaseError.connectionFailed().operation).toBe("connect");
  });

  it("InternalError and helper functions isAppError & toAppError", () => {
    const customErr = new NotFoundError("Not found item");
    expect(isAppError(customErr)).toBe(true);
    expect(toAppError(customErr)).toBe(customErr);

    const standardErr = new Error("Generic error");
    expect(isAppError(standardErr)).toBe(false);

    const converted = toAppError(standardErr);
    expect(converted).toBeInstanceOf(InternalError);
    expect(converted.message).toBe("Generic error");

    const convertedStr = toAppError("String error message");
    expect(convertedStr.message).toBe("String error message");
  });
});
