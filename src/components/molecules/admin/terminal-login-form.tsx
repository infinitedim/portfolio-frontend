"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ThemeConfig } from "@/types/theme";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * Properties for the TerminalLoginForm component.
 *
 * @interface TerminalLoginFormProps
 * @property {() => void} [onLoginSuccess] - Optional callback triggered upon successful authentication or 2FA verification.
 * @property {ThemeConfig} themeConfig - Current terminal theme configuration tokens.
 */
interface TerminalLoginFormProps {
  onLoginSuccess?: () => void;
  themeConfig: ThemeConfig;
}

/**
 * Interactive administrative login form component styled with a cyberpunk terminal aesthetic.
 *
 * Supports email and password credentials submission, handles two-factor authentication challenge transitions
 * (TOTP verification and backup recovery codes), input autofocus, and error message rendering.
 *
 * @param {TerminalLoginFormProps} props - Component properties.
 * @param {() => void} [props.onLoginSuccess] - Success callback invoked after valid sign-in.
 * @param {ThemeConfig} props.themeConfig - Active theme configuration tokens.
 * @returns {React.JSX.Element} The rendered admin login form element.
 */
export function TerminalLoginForm({
  onLoginSuccess,
  themeConfig: _themeConfig,
}: TerminalLoginFormProps): React.JSX.Element {
  const { login, complete2FA } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

              
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (challengeToken) {
      codeInputRef.current?.focus();
    } else {
      emailInputRef.current?.focus();
    }
  }, [challengeToken]);

  /**
   * Handles submission of primary email/password credentials.
   *
   * @param {React.FormEvent} e - Form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email.trim(), password);

      if (result.success && result.requires2FA && result.challengeToken) {
        setChallengeToken(result.challengeToken);
        setPassword("");
        setCode("");
        return;
      }

      if (result.success) {
        setEmail("");
        setPassword("");
        onLoginSuccess?.();
      } else {
        setError(result.error || t("adminLoginFailed") || "Login failed. Please check credentials.");
      }
    } catch (_err) {
      setError(t("adminLoginUnexpectedError") || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles submission of two-factor TOTP or backup recovery code.
   *
   * @param {React.FormEvent} e - Form submission event.
   * @returns {Promise<void>}
   */
  const handleTwoFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken || !code.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await complete2FA(
        challengeToken,
        code.trim(),
        useBackupCode,
      );
      if (result.success) {
        setEmail("");
        setPassword("");
        setCode("");
        setChallengeToken(null);
        onLoginSuccess?.();
      } else {
        setError(result.error || t("admin2FAInvalidCode") || "Invalid 2FA verification code.");
      }
    } catch (_err) {
      setError(t("adminLoginUnexpectedError") || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancels the active two-factor authentication challenge and returns to the email/password prompt.
   *
   * @returns {void}
   */
  const handleCancel2FA = () => {
    setChallengeToken(null);
    setCode("");
    setError(null);
  };

  if (challengeToken) {
    return (
      <form onSubmit={handleTwoFASubmit} className="space-y-4 font-mono text-sm">
        <div className="flex items-center gap-2 mb-2 text-(--terminal-accent)">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="font-semibold text-base">Two-Factor Authentication</h2>
        </div>
        <p className="text-xs text-(--terminal-muted)">
          {useBackupCode
            ? "Enter a single-use 8-character backup verification code."
            : "Enter the 6-digit TOTP code from your authenticator app."}
        </p>

        {error && (
          <div className="p-3 text-xs rounded border border-red-500/40 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="twofa-code">
            {useBackupCode ? "Backup Code" : "Verification Code"}
          </Label>
          <Input
            id="twofa-code"
            ref={codeInputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={useBackupCode ? "a1b2c3d4" : "123456"}
            disabled={isLoading}
            autoComplete="one-time-code"
            aria-label={useBackupCode ? "Backup Code" : "Verification Code"}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-2">
          <button
            type="button"
            onClick={() => setUseBackupCode(!useBackupCode)}
            className="text-(--terminal-accent) hover:underline"
          >
            {useBackupCode ? "Use TOTP app code" : "Use a backup code"}
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel2FA}
            disabled={isLoading}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="terminal"
            size="sm"
            disabled={isLoading || !code.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verify Code"
            )}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-mono text-sm">
      {error && (
        <div className="p-3 text-xs rounded border border-red-500/40 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

                         
      <div className="space-y-1.5">
        <Label htmlFor="admin-email" className="text-xs text-(--terminal-muted)">
          Email Address
        </Label>
        <Input
          id="admin-email"
          ref={emailInputRef}
          type="email"
          value={email}
          onChange={(e) => {
            setError(null);
            setEmail(e.target.value);
          }}
          placeholder="admin@example.com"
          disabled={isLoading}
          autoComplete="email"
          aria-label="Email address"
          required
        />
      </div>

                            
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="admin-password" className="text-xs text-(--terminal-muted)">
            Password
          </Label>
        </div>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setError(null);
              setPassword(e.target.value);
            }}
            placeholder="••••••••••••"
            disabled={isLoading}
            autoComplete="current-password"
            aria-label="Password"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--terminal-muted) hover:text-(--terminal-text) transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

                           
      <div className="pt-2">
        <Button
          type="submit"
          variant="terminal"
          className="w-full justify-between"
          disabled={isLoading || !email.trim() || !password.trim()}
        >
          <span>{isLoading ? "Authenticating..." : "Sign In to Dashboard"}</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
