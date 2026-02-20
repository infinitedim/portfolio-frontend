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
  refreshToken?: string;
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
  refreshToken?: string;
  error?: string;
}

export interface ValidateResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

class AuthService {
  private accessToken: string | null = null;

  private refreshToken: string | null = null;

  private user: AuthUser | null = null;

  private readonly STORAGE_PREFIX = "__auth_";
  private readonly REFRESH_TOKEN_KEY = `${this.STORAGE_PREFIX}rt`;
  private readonly USER_KEY = `${this.STORAGE_PREFIX}user`;

  constructor() {
    if (
      typeof window !== "undefined" &&
      typeof sessionStorage !== "undefined"
    ) {
      this.refreshToken = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          role: data.user.role as "admin",
        };

        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.user = user;

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }

        return {
          success: true,
          user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
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

  async refresh(): Promise<RefreshResponse> {
    if (!this.refreshToken) {
      return {
        success: false,
        error: "No refresh token available",
      };
    }

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
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
        }

        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
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
      if (
        typeof window !== "undefined" &&
        (this.accessToken || this.refreshToken)
      ) {
        await fetch(`${getApiUrl()}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(this.accessToken && {
              Authorization: `Bearer ${this.accessToken}`,
            }),
          },
          body: JSON.stringify({
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
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
    if (!this.accessToken) {
      if (this.refreshToken) {
        const refreshResult = await this.refresh();
        if (!refreshResult.success) {
          return {
            success: false,
            error: "No valid token available",
          };
        }
      } else {
        return {
          success: false,
          error: "No access token available",
        };
      }
    }

    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Token validation is only available on the client side",
      };
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
    this.refreshToken = null;
    this.user = null;

    if (typeof window !== "undefined") {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
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
    if (this.accessToken && this.user) {
      const validation = await this.validate();
      return validation.success;
    }
    return false;
  }
}

export const authService = new AuthService();
