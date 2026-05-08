/**
 * Admin TOTP / 2FA service.
 *
 * Wraps the four backend endpoints introduced in Sprint 2:
 *   POST /api/auth/2fa/setup    -> generate secret + backup codes (NOT enabled yet)
 *   POST /api/auth/2fa/verify   -> finalize enrollment with a TOTP code
 *   POST /api/auth/2fa/disable  -> turn 2FA off (requires password + code)
 *   POST /api/auth/2fa/login    -> exchange a challenge token for tokens
 *                                  (handled in `auth-service.complete2FALogin`)
 *
 * Backup codes are returned ONCE at setup time and never again — the admin
 * page is responsible for surfacing them clearly to the user.
 */

import { authService } from "@/lib/auth/auth-service";

export interface SetupTwoFAResponse {
  /** Base32-encoded shared secret. Useful for manual entry into authenticator apps. */
  secret: string;
  /** Pre-formatted otpauth:// URI for QR-code scanning. */
  otpauthUri: string;
  /** Plain-text backup codes — show once, then never again. */
  backupCodes: string[];
}

export interface TwoFAEnabledResponse {
  enabled: boolean;
}

export interface TwoFAStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.BACKEND_URL ??
    "http://localhost:3001"
  );
}

async function getAuthToken(): Promise<string | null> {
  const existing = authService.getAccessToken();
  if (existing) return existing;
  const refreshed = await authService.refresh();
  if (refreshed.success) {
    return authService.getAccessToken();
  }
  return null;
}

async function authedJson<T>(
  path: string,
  body: unknown,
  method: "POST" = "POST",
): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errMsg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed with status ${res.status}`;
    throw new Error(errMsg);
  }

  return data as T;
}

async function authedGet<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${getApiBase()}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getTwoFactorStatus(): Promise<TwoFAStatus> {
  const data = await authedGet<{
    enabled: boolean;
    backupCodesRemaining?: number;
    backup_codes_remaining?: number;
  }>("/api/auth/2fa/status");
  return {
    enabled: data.enabled,
    backupCodesRemaining:
      data.backupCodesRemaining ?? data.backup_codes_remaining ?? 0,
  };
}

export async function setupTwoFactor(): Promise<SetupTwoFAResponse> {
  const data = await authedJson<{
    success: boolean;
    secret: string;
    otpauthUri?: string;
    otpauth_uri?: string;
    backupCodes?: string[];
    backup_codes?: string[];
    error?: string;
  }>("/api/auth/2fa/setup", {});

  if (!data.success || !data.secret) {
    throw new Error(data.error ?? "Failed to start 2FA setup");
  }

  return {
    secret: data.secret,
    otpauthUri: data.otpauthUri ?? data.otpauth_uri ?? "",
    backupCodes: data.backupCodes ?? data.backup_codes ?? [],
  };
}

export async function verifyTwoFactor(
  code: string,
): Promise<TwoFAEnabledResponse> {
  const data = await authedJson<{
    success: boolean;
    enabled?: boolean;
    error?: string;
  }>("/api/auth/2fa/verify", { code });

  if (!data.success) {
    throw new Error(data.error ?? "Invalid 2FA code");
  }

  return { enabled: data.enabled ?? true };
}

export async function disableTwoFactor(
  password: string,
  code: string,
  isBackupCode = false,
): Promise<void> {
  const data = await authedJson<{ success: boolean; error?: string }>(
    "/api/auth/2fa/disable",
    { password, code, isBackupCode },
  );
  if (!data.success) {
    throw new Error(data.error ?? "Failed to disable 2FA");
  }
}
