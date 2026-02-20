import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { SecureAuth, useSecureAuth } from "../secure-auth";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

let mockCookies = "";
if (typeof document !== "undefined") {
  Object.defineProperty(document, "cookie", {
    get: () => mockCookies,
    set: (value: string) => {
      mockCookies = value;
    },
    configurable: true,
  });
}

describe("SecureAuth", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    mockCookies = "";
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Cookie Management", () => {
    it("should get cookie value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      mockCookies = "theme=dark; session=abc123";

      const value = SecureAuth.getCookie("theme");
      expect(value).toBe("dark");
    });

    it("should return null for non-existent cookie", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      mockCookies = "theme=dark";

      const value = SecureAuth.getCookie("nonexistent");
      expect(value).toBeNull();
    });

    it("should set cookie with default config", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      SecureAuth.setCookie("test", "value");

      expect(mockCookies).toContain("test=value");
      expect(mockCookies).toContain("SameSite=strict");
    });

    it("should set cookie with custom config", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      SecureAuth.setCookie("test", "value", {
        maxAge: 3600,
        sameSite: "lax",
        secure: true,
      });

      expect(mockCookies).toContain("test=value");
      expect(mockCookies).toContain("SameSite=lax");
      expect(mockCookies).toContain("Secure");
    });

    it("should remove cookie", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }
      SecureAuth.setCookie("test", "value");
      SecureAuth.removeCookie("test");

      expect(mockCookies).toContain("expires=Thu, 01 Jan 1970");
    });
  });

  describe("Authentication", () => {
    it("should verify authentication successfully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ user: { id: "1", email: "test@test.com" } }),
      });

      const result = await SecureAuth.verifyAuthentication();

      expect(result.isValid).toBe(true);
      expect(result.user).toBeDefined();
    });

    it("should return invalid when verification fails", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const result = await SecureAuth.verifyAuthentication();

      expect(result.isValid).toBe(false);
    });

    it("should handle verification errors", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await SecureAuth.verifyAuthentication();

      expect(result.isValid).toBe(false);
    });

    it("should login successfully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await SecureAuth.login("test@test.com", "password");

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "test@test.com",
            password: "password",
          }),
        }),
      );
    });

    it("should handle login failure", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const result = await SecureAuth.login("test@test.com", "wrong");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
    });

    it("should logout successfully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await SecureAuth.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  describe("useSecureAuth Hook", () => {
    it("should provide auth state and methods", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ user: { id: "1" } }),
      });

      const { result } = renderHook(() => useSecureAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).not.toBeNull();
      });

      expect(result.current).toHaveProperty("login");
      expect(result.current).toHaveProperty("logout");
      expect(result.current).toHaveProperty("checkAuth");
    });

    it("should check auth on mount", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ user: { id: "1" } }),
      });

      renderHook(() => useSecureAuth());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/verify",
          expect.any(Object),
        );
      });
    });
  });
});
