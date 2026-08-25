import { encryptedFetchRaw } from "@/lib/crypto/encrypted-fetch";

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
                                                                       
                                                              
    const validation = await this.validate();
    return validation.success;
  }
}

export const authService = new AuthService();
