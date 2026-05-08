"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, type AuthUser } from "@/lib/auth/auth-service";

export interface LoginResult {
  success: boolean;
  error?: string;
  requires2FA?: boolean;
  challengeToken?: string;
}

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Don't set the user yet — they're not fully authenticated until
        // the TOTP challenge completes.
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
        error:
          error instanceof Error ? error.message : "2FA challenge failed",
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
