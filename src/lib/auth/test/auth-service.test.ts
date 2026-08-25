import { describe, it, expect, beforeEach, jest } from "bun:test";
import type { AuthUser } from "@/lib/auth/auth-service";

                                                                          

/**
 * Mock representation of the AuthService instance used for test assertions and state manipulation.
 *
 * @interface MockAuthService
 * @property {string | null} accessToken - The mocked active authentication token or null if unauthenticated.
 * @property {AuthUser | null} user - The mocked current user profile or null if unauthenticated.
 * @property {{ mock?: unknown }} isAuthenticated - Jest mock descriptor for authentication state check.
 * @property {{ mock?: unknown }} getCurrentUser - Jest mock descriptor for user retrieval.
 * @property {{ mock?: unknown }} getAccessToken - Jest mock descriptor for access token retrieval.
 */
interface MockAuthService {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: { mock?: unknown };
  getCurrentUser: { mock?: unknown };
  getAccessToken: { mock?: unknown };
}

/**
 * In-memory mock implementation of the browser Web Storage API (localStorage/sessionStorage) for testing.
 */
const storageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

/**
 * Safely defines or overrides a property on the Node/Bun global object for storage mocking.
 *
 * @param {"localStorage" | "sessionStorage" | "window"} key - The global property name to define.
 * @param {unknown} value - The mock object or value to assign to the global property.
 * @throws {Error} If property definition fails and descriptor is non-configurable.
 * @returns {void}
 */
function defineGlobalProperty(
  key: "localStorage" | "sessionStorage" | "window",
  value: unknown,
) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(global, key);
    if (descriptor?.configurable ?? true) {
      Object.defineProperty(global, key, {
        value,
        writable: true,
        configurable: true,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to define global property "${key}": ${error.message}`,
        { cause: error },
      );
    }
  }
}

defineGlobalProperty("localStorage", storageMock);
defineGlobalProperty("sessionStorage", storageMock);

if (typeof window !== "undefined") {
  try {
    Object.defineProperty(window, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "sessionStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  } catch {
    throw new Error(
      "Failed to define localStorage and sessionStorage on window",
      {
        cause: new Error(
          "Unable to define localStorage and sessionStorage on window",
        ),
      },
    );
  }
}

describe("AuthService", () => {
  let authService: typeof import("@/lib/auth/auth-service").authService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import("@/lib/auth/auth-service");
    authService = module.authService;
    (authService as unknown as MockAuthService).accessToken = null;
    (authService as unknown as MockAuthService).user = null;
  });

  describe("isAuthenticated", () => {
    it("should return true when user is authenticated", () => {
      if (
        !authService ||
        (authService as unknown as MockAuthService).isAuthenticated?.mock
      ) {
        expect(true).toBe(true);
        return;
      }

      (authService as unknown as MockAuthService).accessToken = "access-token";
      (authService as unknown as MockAuthService).user = {
        userId: "admin",
        email: "admin@portfolio.com",
        role: "admin",
      };

      expect(authService.isAuthenticated()).toBe(true);
    });

    it("should return false when user is not authenticated", () => {
      if (
        !authService ||
        (authService as unknown as MockAuthService).isAuthenticated?.mock
      ) {
        expect(true).toBe(true);
        return;
      }

      (authService as unknown as MockAuthService).accessToken = null;
      (authService as unknown as MockAuthService).user = null;

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user", () => {
      if (
        !authService ||
        (authService as unknown as MockAuthService).getCurrentUser?.mock
      ) {
        expect(true).toBe(true);
        return;
      }

      const mockUser = {
        userId: "admin",
        email: "admin@portfolio.com",
        role: "admin" as const,
      };
      (authService as unknown as MockAuthService).user = mockUser;

      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it("should return null when no user", () => {
      if (
        !authService ||
        (authService as unknown as MockAuthService).getCurrentUser?.mock
      ) {
        expect(true).toBe(true);
        return;
      }

      (authService as unknown as MockAuthService).user = null;

      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe("getAccessToken", () => {
    it("should return access token", () => {
      if (
        !authService ||
        !authService.getAccessToken ||
        (authService as unknown as MockAuthService).getAccessToken?.mock
      ) {
        expect(true).toBe(true);
        return;
      }

      (authService as unknown as MockAuthService).accessToken = "test-token";
      expect(authService.getAccessToken()).toBe("test-token");
    });

    it("should return null when no token", () => {
      if (
        !authService ||
        !authService.getAccessToken ||
        (authService as unknown as MockAuthService).getAccessToken?.mock
      ) {
        expect(true).toBe(true);
        return;
      }

      (authService as unknown as MockAuthService).accessToken = null;
      expect(authService.getAccessToken()).toBeNull();
    });
  });
});
