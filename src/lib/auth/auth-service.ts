function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export interface AuthUser {
  userId: string;
  email: string;
  role: "admin";
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  error?: string;
  /**
   * Set when the backend recognized the password but the account has TOTP
   * 2FA enabled. The caller must collect a 6-digit TOTP (or backup code)
   * and call `complete2FALogin()` to exchange the challenge for real
   * tokens. `accessToken` will NOT be set in this case.
   */
  requires2FA?: boolean;
  challengeToken?: string;
}

export interface Complete2FAResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  error?: string;
}

export interface ValidateResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Client-side auth state. Refresh tokens are now delivered as an HttpOnly
 * cookie (see backend `auth.rs` -> `build_refresh_cookie`) which JS cannot
 * read. We only keep the access token in memory and a thin user record in
 * sessionStorage so the UI can render without flicker on reload.
 *
 * On reload we have no access token in memory, so `validate()` will call
 * `/api/auth/refresh`, which uses the cookie to issue a fresh access token.
 */
class AuthService {
  private accessToken: string | null = null;

  private user: AuthUser | null = null;

  private readonly STORAGE_PREFIX = "__auth_";
  private readonly USER_KEY = `${this.STORAGE_PREFIX}user`;
  private readonly LEGACY_REFRESH_KEY = `${this.STORAGE_PREFIX}rt`;

  constructor() {
    if (
      typeof window !== "undefined" &&
      typeof sessionStorage !== "undefined"
    ) {
      const userStr = sessionStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch {
          this.user = null;
          sessionStorage.removeItem(this.USER_KEY);
        }
      }

      this.migrateFromLocalStorage();
      this.purgeLegacyRefreshToken();
    }
  }

  private migrateFromLocalStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;

    const oldKeys = ["accessToken", "refreshToken", "user"];
    oldKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Older builds stored the refresh token under `__auth_rt` in sessionStorage.
   * That value is now an HttpOnly cookie and the storage entry is a security
   * liability — wipe it on every boot.
   */
  private purgeLegacyRefreshToken(): void {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(this.LEGACY_REFRESH_KEY)) {
      sessionStorage.removeItem(this.LEGACY_REFRESH_KEY);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      if (typeof window === "undefined") {
        return {
          success: false,
          error: "Login is only available on the client side",
        };
      }

      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Required so the browser stores the HttpOnly refresh-token cookie
        // returned by the backend.
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 2FA challenge: password was correct but the account requires a
        // second factor. Don't populate the access token yet — the caller
        // must complete the challenge.
        if (data.requires2fa || data.requires2FA) {
          const user: AuthUser | undefined = data.user
            ? {
                userId: data.user.userId,
                email: data.user.email,
                role: data.user.role as "admin",
              }
            : undefined;

          return {
            success: true,
            requires2FA: true,
            challengeToken: data.challengeToken ?? data.challenge_token,
            user,
          };
        }

        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          role: data.user.role as "admin",
        };

        this.accessToken = data.accessToken;
        this.user = user;

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }

        return {
          success: true,
          user,
          accessToken: data.accessToken,
        };
      } else {
        return {
          success: false,
          error: data.error ?? "Invalid credentials",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Exchange a 2FA challenge token + 6-digit TOTP (or backup code) for a
   * real access/refresh-cookie pair. Mirrors `login()` in terms of state
   * mutations on success.
   */
  async complete2FALogin(
    challengeToken: string,
    code: string,
    isBackupCode = false,
  ): Promise<Complete2FAResponse> {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "2FA challenge can only be completed on the client side",
      };
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/2fa/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          challengeToken,
          code,
          isBackupCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user && data.accessToken) {
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          role: data.user.role as "admin",
        };

        this.accessToken = data.accessToken;
        this.user = user;

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }

        return { success: true, user, accessToken: data.accessToken };
      }

      return {
        success: false,
        error: data.error ?? "Invalid or expired 2FA code",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async refresh(): Promise<RefreshResponse> {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Token refresh is only available on the client side",
      };
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // The refresh token lives in an HttpOnly cookie. We don't (and can't)
        // read it from JS — the browser attaches it because of `credentials`.
        credentials: "include",
        body: "{}",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.accessToken = data.accessToken;

        return {
          success: true,
          accessToken: data.accessToken,
        };
      } else {
        this.clearTokens();
        return {
          success: false,
          error: data.error ?? "Token refresh failed",
        };
      }
    } catch (error) {
      this.clearTokens();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<RegisterResponse> {
    try {
      if (typeof window === "undefined") {
        return {
          success: false,
          error: "Registration is only available on the client side",
        };
      }

      const response = await fetch(`${getApiUrl()}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          role: data.user.role as "admin",
        };

        return {
          success: true,
          user,
        };
      } else {
        return {
          success: false,
          error: data.error ?? "Registration failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async logout(): Promise<boolean> {
    try {
      if (typeof window !== "undefined") {
        await fetch(`${getApiUrl()}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(this.accessToken && {
              Authorization: `Bearer ${this.accessToken}`,
            }),
          },
          // Send the cookie so the server can revoke it server-side and the
          // response can clear it client-side.
          credentials: "include",
          body: JSON.stringify({
            accessToken: this.accessToken,
          }),
        });
      }
    } catch {
      void 0;
    }

    this.clearTokens();
    return true;
  }

  async validate(): Promise<ValidateResponse> {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Token validation is only available on the client side",
      };
    }

    // No access token in memory (e.g. after a hard reload). Try the cookie
    // first — `/api/auth/refresh` reads the HttpOnly cookie and mints a new
    // access token if the session is still valid.
    if (!this.accessToken) {
      const refreshResult = await this.refresh();
      if (!refreshResult.success) {
        this.clearTokens();
        return {
          success: false,
          error: "No valid session",
        };
      }
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && (data.success || data.isValid)) {
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          role: data.user.role as "admin",
        };

        this.user = user;

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }

        return {
          success: true,
          user,
        };
      } else {
        // Access token rejected — try one refresh round-trip via the cookie
        // before declaring the session dead.
        const refreshResult = await this.refresh();
        if (refreshResult.success) {
          return this.validate();
        }

        this.clearTokens();
        return {
          success: false,
          error: data.error ?? "Token validation failed",
        };
      }
    } catch (error) {
      this.clearTokens();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.user = null;

    if (typeof window !== "undefined") {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(this.LEGACY_REFRESH_KEY);
        sessionStorage.removeItem(this.USER_KEY);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    }
  }

  async initialize(): Promise<boolean> {
    // Always run validate() — even with no in-memory access token, the
    // HttpOnly refresh cookie may still be present and valid.
    const validation = await this.validate();
    return validation.success;
  }
}

export const authService = new AuthService();
