import { useState, useEffect, useCallback } from "react";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export interface AuthConfig {
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
}

export class SecureAuth {
  private static readonly DEFAULT_CONFIG: Required<AuthConfig> = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  };

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

  static removeCookie(name: string, path: string = "/"): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Strict`;
  }

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

  static async login(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    error?: string;
    accessToken?: string;
    refreshToken?: string;
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
          refreshToken: data.refreshToken,
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

  static async logout(
    accessToken?: string,
    refreshToken?: string,
  ): Promise<void> {
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
          refreshToken,
        }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
}

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
