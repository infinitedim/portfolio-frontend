"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService, type AuthUser } from "@/lib/auth/auth-service";

/**
 * Result structure returned by user login operations.
 *
 * @interface LoginResult
 * @property {boolean} success - Indicates whether the login request succeeded or requires subsequent verification.
 * @property {string} [error] - Descriptive error message if the login attempt failed.
 * @property {boolean} [requires2FA] - Flag indicating if two-factor authentication is required.
 * @property {string} [challengeToken] - Temporary challenge token required to complete 2FA verification.
 */
export interface LoginResult {
  success: boolean;
  error?: string;
  requires2FA?: boolean;
  challengeToken?: string;
}

/**
 * Type contract for the authentication context state and exposed dispatch methods.
 *
 * @interface AuthContextType
 * @property {AuthUser | null} user - The currently authenticated user object, or null if unauthenticated.
 * @property {boolean} isAuthenticated - Whether a user is currently authenticated.
 * @property {boolean} isLoading - Loading state while checking or initializing authentication on mount.
 * @property {(email: string, password: string) => Promise<LoginResult>} login - Authenticates user with credentials.
 * @property {(challengeToken: string, code: string, isBackupCode?: boolean) => Promise<{ success: boolean; error?: string }>} complete2FA - Completes two-factor verification.
 * @property {() => Promise<void>} logout - Logs out the user and clears session tokens.
 * @property {() => Promise<{ success: boolean; error?: string }>} refresh - Manually refreshes session authentication tokens.
 */
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  complete2FA: (
    challengeToken: string,
    code: string,
    isBackupCode?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * React Context instance providing authentication state to subscriber components.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * React Context Provider component that initializes authentication state,
 * manages automatic token refreshes at periodic intervals, and exposes auth action handlers.
 *
 * @param {object} props - Component properties.
 * @param {React.ReactNode} props.children - Child component nodes to receive the authentication context.
 * @returns {React.JSX.Element} The rendered context provider element.
 *
 * @example
 * ```tsx
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return <AuthProvider>{children}</AuthProvider>;
 * }
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuthenticated = await authService.initialize();
        if (isAuthenticated) {
          setUser(authService.getCurrentUser());
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          const result = await authService.refresh();
          if (result.success) {
            setUser(authService.getCurrentUser());
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          setUser(null);
        }
      },
      14 * 60 * 1000,
    );

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const result = await authService.login(email, password);

      if (result.success && result.requires2FA && result.challengeToken) {
        return {
          success: true,
          requires2FA: true,
          challengeToken: result.challengeToken,
        };
      }

      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const complete2FA = async (
    challengeToken: string,
    code: string,
    isBackupCode = false,
  ) => {
    try {
      const result = await authService.complete2FALogin(
        challengeToken,
        code,
        isBackupCode,
      );
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "2FA challenge failed",
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    }
  };

  const refresh = async () => {
    try {
      const result = await authService.refresh();
      if (result.success) {
        setUser(authService.getCurrentUser());
        return { success: true };
      } else {
        setUser(null);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setUser(null);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    complete2FA,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom React hook to access the current authentication context.
 * Must be used within a descendant of `<AuthProvider>`.
 *
 * @returns {AuthContextType} The authentication context containing user state and auth methods.
 * @throws {Error} Throws an error if invoked outside of an `<AuthProvider>`.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
