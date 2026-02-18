// Authentication service - connects to Rust backend API

/**
 * Get the API URL for authentication requests
 * Uses NEXT_PUBLIC_API_URL environment variable, falling back to localhost
 */
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

/**
 * Represents an authenticated user in the system
 * @property userId - Unique identifier for the user
 * @property email - User's email address
 * @property role - User's role (currently only "admin" is supported)
 */
export interface AuthUser {
  userId: string;
  email: string;
  role: "admin";
}

/**
 * Response object returned from login attempts
 * @property success - Whether the login was successful
 * @property user - User information if login succeeded
 * @property accessToken - JWT access token for API requests
 * @property refreshToken - JWT refresh token for obtaining new access tokens
 * @property error - Error message if login failed
 */
export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Response object returned from registration attempts
 * @property success - Whether the registration was successful
 * @property user - User information if registration succeeded
 * @property error - Error message if registration failed
 */
export interface RegisterResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Response object returned from token refresh attempts
 * @property success - Whether the refresh was successful
 * @property accessToken - New JWT access token
 * @property refreshToken - New JWT refresh token
 * @property error - Error message if refresh failed
 */
export interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Response object returned from token validation attempts
 * @property success - Whether the validation was successful
 * @property user - User information if validation succeeded
 * @property error - Error message if validation failed
 */
export interface ValidateResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Service for managing user authentication with secure token storage
 *
 * Provides methods for login, logout, token refresh, and validation.
 * Uses a hybrid storage approach for security:
 * - Access tokens: in-memory only (not persisted)
 * - Refresh tokens: sessionStorage (cleared on browser close)
 * - User data: sessionStorage (cleared on browser close)
 *
 * Security features:
 * 1. Access tokens kept in memory only (not persisted to storage)
 * 2. Refresh tokens use sessionStorage (cleared on browser close)
 * 3. User data uses sessionStorage instead of localStorage
 * 4. Automatic migration from insecure localStorage
 *
 * @remarks
 * For maximum security in production, consider implementing httpOnly cookies
 * on the backend for token storage.
 *
 * @example
 * ```ts
 * const result = await authService.login('user@example.com', 'password');
 * if (result.success) {
 *   console.log('Logged in as:', result.user?.email);
 * }
 * ```
 */
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

  /**
   * One-time migration from localStorage to sessionStorage
   * Clears old insecure storage
   */
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
   * Authenticates a user with email and password credentials
   * Stores tokens securely and returns user information on success
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to LoginResponse with user data and tokens
   * @example
   * ```ts
   * const response = await authService.login('admin@example.com', 'secure-password');
   * if (response.success) {
   *   console.log('Welcome', response.user?.email);
   * }
   * ```
   */
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

  /**
   * Refreshes the access token using the stored refresh token
   * Automatically updates stored tokens on success
   * @returns Promise resolving to RefreshResponse with new tokens
   * @throws Clears tokens if refresh fails (requires re-login)
   * @example
   * ```ts
   * const response = await authService.refresh();
   * if (response.success) {
   *   console.log('Token refreshed successfully');
   * }
   * ```
   */
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

  /**   * Registers a new admin user (only works if no admin exists)
   * @param email - User's email address
   * @param password - User's password
   * @param firstName - User's first name (optional)
   * @param lastName - User's last name (optional)
   * @returns Promise resolving to RegisterResponse with user data
   * @example
   * ```ts
   * const response = await authService.register('admin@example.com', 'secure-password', 'John', 'Doe');
   * if (response.success) {
   *   console.log('Account created successfully!');
   * }
   * ```
   */
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

  /**   * Logs out the current user and clears all authentication data
   * Notifies the server of logout if an access token is available
   * @returns Promise resolving to true when logout is complete
   * @example
   * ```ts
   * await authService.logout();
   * console.log('User logged out');
   * ```
   */
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
      // Ignore errors - logout should always clear local tokens
    }

    this.clearTokens();
    return true;
  }

  /**
   * Validates the current access token with the server
   * Automatically attempts token refresh if validation fails
   * @returns Promise resolving to ValidateResponse with user data
   * @example
   * ```ts
   * const response = await authService.validate();
   * if (response.success) {
   *   console.log('Token is valid for:', response.user?.email);
   * }
   * ```
   */
  async validate(): Promise<ValidateResponse> {
    if (!this.accessToken) {
      // Try to refresh if we have a refresh token
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
        // Try to refresh token
        const refreshResult = await this.refresh();
        if (refreshResult.success) {
          // Retry validation with new token
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

  /**
   * Checks if a user is currently authenticated
   * @returns True if both access token and user data are present
   * @example
   * ```ts
   * if (authService.isAuthenticated()) {
   *   console.log('User is logged in');
   * }
   * ```
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  /**
   * Retrieves the currently authenticated user's information
   * @returns AuthUser object if authenticated, null otherwise
   * @example
   * ```ts
   * const user = authService.getCurrentUser();
   * if (user) {
   *   console.log('Current user:', user.email);
   * }
   * ```
   */
  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  /**
   * Retrieves the current access token from memory
   * @returns Access token string if available, null otherwise
   * @remarks Token is stored in memory only, not persisted
   * @example
   * ```ts
   * const token = authService.getAccessToken();
   * if (token) {
   *   // Use token for API requests
   * }
   * ```
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Clear all tokens and user data securely
   */
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

  /**
   * Initializes authentication state by validating stored credentials
   * Should be called on application startup
   * @returns Promise resolving to true if user is authenticated, false otherwise
   * @example
   * ```ts
   * const isAuth = await authService.initialize();
   * if (isAuth) {
   *   console.log('User session restored');
   * }
   * ```
   */
  async initialize(): Promise<boolean> {
    if (this.accessToken && this.user) {
      const validation = await this.validate();
      return validation.success;
    }
    return false;
  }
}

/**
 * Singleton instance of AuthService for application-wide authentication management
 * @example
 * ```ts
 * import { authService } from '@/lib/auth';
 *
 * const result = await authService.login(email, password);
 * ```
 */
export const authService = new AuthService();
