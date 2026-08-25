import { encryptedFetchRaw } from "@/lib/crypto/encrypted-fetch";

/**
 * Representation of an authenticated user entity.
 *
 * @interface AuthUser
 * @property {string} userId - Unique identifier of the user.
 * @property {string} email - Registered email address of the user.
 * @property {"admin"} role - Access control role assigned to the user.
 */
export interface AuthUser {
  userId: string;
  email: string;
  role: "admin";
}

/**
 * Response structure returned upon initiating a user login.
 *
 * @interface LoginResponse
 * @property {boolean} success - Indicates whether the request was successful.
 * @property {AuthUser} [user] - Authenticated user profile data.
 * @property {string} [accessToken] - JWT access token issued for session authorization.
 * @property {string} [error] - Error message if login failed.
 * @property {boolean} [requires2FA] - Indicates whether a secondary two-factor verification step is required.
 * @property {string} [challengeToken] - Temporary challenge token to be used when solving the 2FA challenge.
 */
export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  error?: string;
  requires2FA?: boolean;
  challengeToken?: string;
}

/**
 * Response structure returned after completing a two-factor authentication challenge.
 *
 * @interface Complete2FAResponse
 * @property {boolean} success - Indicates whether the 2FA verification succeeded.
 * @property {AuthUser} [user] - Authenticated user details upon successful verification.
 * @property {string} [accessToken] - Issued JWT access token.
 * @property {string} [error] - Error description if 2FA verification failed.
 */
export interface Complete2FAResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  error?: string;
}

/**
 * Response structure returned upon completing a user registration request.
 *
 * @interface RegisterResponse
 * @property {boolean} success - Indicates whether registration succeeded.
 * @property {AuthUser} [user] - Newly registered user profile.
 * @property {string} [error] - Error message if registration failed.
 */
export interface RegisterResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Response structure returned from a session token refresh request.
 *
 * @interface RefreshResponse
 * @property {boolean} success - Indicates whether token refresh was successful.
 * @property {string} [accessToken] - Newly issued JWT access token.
 * @property {string} [error] - Error message if token refresh failed.
 */
export interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  error?: string;
}

/**
 * Response structure returned from session validation and verification.
 *
 * @interface ValidateResponse
 * @property {boolean} success - Indicates whether the current session is valid.
 * @property {AuthUser} [user] - Validated user profile.
 * @property {string} [error] - Error message if validation failed.
 */
export interface ValidateResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Service managing client-side authentication lifecycle, token storage, encrypted API requests,
 * session refresh routines, and two-factor authentication workflows.
 */
class AuthService {
  private accessToken: string | null = null;
  private user: AuthUser | null = null;
  private readonly STORAGE_PREFIX = "__auth_";
  private readonly USER_KEY = `${this.STORAGE_PREFIX}user`;
  private readonly LEGACY_REFRESH_KEY = `${this.STORAGE_PREFIX}rt`;

  /**
   * Initializes the `AuthService` instance, restoring persisted user state from `sessionStorage`
   * and purging legacy storage artifacts from previous authentication versions.
   */
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

  /**
   * Migrates legacy credentials previously stored in `localStorage` by purging them.
   *
   * @private
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
   * Purges legacy refresh tokens from `sessionStorage` to enforce secure cookie-based refresh tokens.
   *
   * @private
   */
  private purgeLegacyRefreshToken(): void {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(this.LEGACY_REFRESH_KEY)) {
      sessionStorage.removeItem(this.LEGACY_REFRESH_KEY);
    }
  }

  /**
   * Authenticates user using email and password via encrypted transport.
   *
   * @param email - User email address.
   * @param password - User password.
   * @returns Promise resolving to login response data or 2FA challenge.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      if (typeof window === "undefined") {
        return {
          success: false,
          error: "Login is only available on the client side",
        };
      }

      const response = await encryptedFetchRaw("/api/auth/login", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
   * Submits a TOTP code or backup code to complete a two-factor authentication login challenge.
   *
   * @param challengeToken - Challenge token received from primary login step.
   * @param code - TOTP verification code or backup code string.
   * @param isBackupCode - Flag indicating if the submitted code is a backup code.
   * @returns Promise resolving to 2FA completion response.
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
      const response = await encryptedFetchRaw("/api/auth/2fa/login", {
        method: "POST",
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

  /**
   * Refreshes the active access token using the HTTP-only secure refresh cookie.
   *
   * @returns Promise resolving to refresh response containing the new access token.
   */
  async refresh(): Promise<RefreshResponse> {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Token refresh is only available on the client side",
      };
    }

    try {
      const response = await encryptedFetchRaw("/api/auth/refresh", {
        method: "POST",
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

  /**
   * Registers a new user account with provided credentials and personal details.
   *
   * @param email - Email address for new account.
   * @param password - Account password.
   * @param firstName - Optional user first name.
   * @param lastName - Optional user last name.
   * @returns Promise resolving to registration result.
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

      const response = await encryptedFetchRaw("/api/auth/register", {
        method: "POST",
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

  /**
   * Logs out the user by invalidating server-side sessions and purging local state.
   *
   * @returns Promise resolving to true when logout concludes.
   */
  async logout(): Promise<boolean> {
    try {
      if (typeof window !== "undefined") {
        await encryptedFetchRaw("/api/auth/logout", {
          method: "POST",
          headers: {
            ...(this.accessToken && {
              Authorization: `Bearer ${this.accessToken}`,
            }),
          },
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

  /**
   * Validates the active access token with the backend server, attempting token refresh if needed.
   *
   * @returns Promise resolving to session validation status.
   */
  async validate(): Promise<ValidateResponse> {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Token validation is only available on the client side",
      };
    }

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
      const response = await encryptedFetchRaw("/api/auth/verify", {
        method: "POST",
        headers: {
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

  /**
   * Checks whether the service currently has an authenticated session in memory.
   *
   * @returns True if both access token and user profile are loaded; false otherwise.
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  /**
   * Retrieves the currently authenticated user entity from memory.
   *
   * @returns The authenticated user object, or null if unauthenticated.
   */
  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  /**
   * Retrieves the current in-memory JWT access token.
   *
   * @returns Access token string, or null if unauthenticated.
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Purges all in-memory credentials and clears user data from storage.
   *
   * @private
   */
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

  /**
   * Initializes authentication state by validating existing sessions or attempting automatic token refresh.
   *
   * @returns Promise resolving to true if valid authentication session was established.
   */
  async initialize(): Promise<boolean> {
    const validation = await this.validate();
    return validation.success;
  }
}

/**
 * Singleton instance of `AuthService` exported for application-wide authentication management.
 */
export const authService = new AuthService();
