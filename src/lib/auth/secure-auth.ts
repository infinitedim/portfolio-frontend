import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/lib/api/get-api-url";

/**
 * Configuration options for managing secure HTTP and client-side cookies.
 *
 * @interface AuthConfig
 * @property {boolean} [secure] - Indicates whether cookie transmission requires HTTPS.
 * @property {"strict" | "lax" | "none"} [sameSite] - SameSite cookie attribute policy.
 * @property {number} [maxAge] - Time-to-live duration in seconds.
 * @property {string} [path] - URL path scope for cookie validity.
 */
export interface AuthConfig {
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
}

/**
 * Utility class providing static methods for secure cookie management,
 * token verification, and backend authentication endpoints.
 */
export class SecureAuth {
  /**
   * Default security configuration applied to cookies managed by SecureAuth.
   *
   * @private
   */
  private static readonly DEFAULT_CONFIG: Required<AuthConfig> = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  };

  /**
   * Retrieves the value of a client-readable cookie by name.
   *
   * @param name - Name of the target cookie.
   * @returns Cookie value if found, or null if missing/not in browser environment.
   */
  static getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue || null;
    }

    return null;
  }

  /**
   * Sets a cookie in document.cookie with secure defaults (SameSite, expiry, path, HTTPS).
   *
   * @param name - Cookie identifier name.
   * @param value - Cookie string value.
   * @param config - Optional overrides for cookie settings.
   */
  static setCookie(
    name: string,
    value: string,
    config?: Partial<AuthConfig>,
  ): void {
    if (typeof document === "undefined") return;

    const options = { ...this.DEFAULT_CONFIG, ...config };
    const expires = new Date(Date.now() + options.maxAge * 1000).toUTCString();

    let cookieString = `${name}=${value}; expires=${expires}; path=${options.path}; SameSite=${options.sameSite}`;

    if (options.secure) {
      cookieString += "; Secure";
    }

    document.cookie = cookieString;
  }

  /**
   * Removes a cookie by setting its expiration to the epoch.
   *
   * @param name - Name of cookie to remove.
   * @param path - Path scope of the cookie.
   */
  static removeCookie(name: string, path: string = "/"): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Strict`;
  }

  /**
   * Verifies authentication status against the backend verify endpoint.
   *
   * @param accessToken - Optional access token override.
   * @returns Object with validation status and user profile if valid.
   */
  static async verifyAuthentication(accessToken?: string): Promise<{
    isValid: boolean;
    user?: Record<string, unknown>;
  }> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${getApiUrl()}/api/auth/verify`, {
        method: "POST",
        headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        const isValid = data.success || data.isValid;
        return { isValid, user: data.user };
      } else {
        return { isValid: false };
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
      return { isValid: false };
    }
  }

  /**
   * Performs credential login request against the backend auth endpoint.
   *
   * @param email - User email address.
   * @param password - User password.
   * @returns Object indicating success status, optional error, accessToken, and user payload.
   */
  static async login(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    error?: string;
    accessToken?: string;
    user?: Record<string, unknown>;
  }> {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          accessToken: data.accessToken,
          user: data.user,
        };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  }

  /**
   * Performs user logout request against backend auth endpoint.
   *
   * @param accessToken - Optional access token.
   * @returns Promise resolving when logout request finishes.
   */
  static async logout(accessToken?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      await fetch(`${getApiUrl()}/api/auth/logout`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          accessToken,
        }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
}

/**
 * Custom React hook managing basic authentication state, verification on mount,
 * and exposing login, logout, and verification utilities.
 *
 * @returns Object containing authentication state and handler methods.
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, login, logout } = useSecureAuth();
 * ```
 */
export function useSecureAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<unknown>(null);

  const checkAuth = useCallback(async () => {
    const result = await SecureAuth.verifyAuthentication();
    setIsAuthenticated(result.isValid);
    setUser(result.user || null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await SecureAuth.login(email, password);
      if (result.success) {
        await checkAuth();
      }
      return result;
    },
    [checkAuth],
  );

  const logout = useCallback(async () => {
    await SecureAuth.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
  };
}
