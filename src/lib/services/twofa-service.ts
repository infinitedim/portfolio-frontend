import { authService } from "@/lib/auth/auth-service";
import { getApiUrl } from "@/lib/api/get-api-url";

/**
 * Response payload returned when initializing Two-Factor Authentication setup.
 */
export interface SetupTwoFAResponse {
  /** The base32-encoded shared secret key for TOTP authenticator apps. */
  secret: string;
  /** Complete `otpauth://` URI string suitable for QR code generation. */
  otpauthUri: string;
  /** List of single-use emergency backup recovery codes. */
  backupCodes: string[];
}

/**
 * Response payload indicating the resulting status of a 2FA operation.
 */
export interface TwoFAEnabledResponse {
  /** Flag indicating whether Two-Factor Authentication is currently active. */
  enabled: boolean;
}

/**
 * Status overview of Two-Factor Authentication for the currently authenticated user.
 */
export interface TwoFAStatus {
  /** Flag indicating whether Two-Factor Authentication is active on the account. */
  enabled: boolean;
  /** Number of unused emergency backup codes remaining. */
  backupCodesRemaining: number;
}

/**
 * Retrieves the base API URL for Two-Factor Authentication endpoints.
 *
 * @returns The resolved base API endpoint URL string.
 */
function getApiBase(): string {
  return getApiUrl();
}

/**
 * Retrieves a valid access token for authenticated API requests, attempting a session refresh if necessary.
 *
 * @returns A promise resolving to the bearer access token string, or null if unauthenticated.
 */
async function getAuthToken(): Promise<string | null> {
  const existing = authService.getAccessToken();
  if (existing) return existing;
  const refreshed = await authService.refresh();
  if (refreshed.success) {
    return authService.getAccessToken();
  }
  return null;
}

/**
 * Sends an authenticated JSON HTTP request (POST, PUT, etc.) to the specified API path.
 *
 * @template T - Expected JSON response payload type.
 * @param path - Relative API endpoint path.
 * @param body - Request payload data to serialize as JSON.
 * @param method - HTTP method to use (defaults to "POST").
 * @returns A promise resolving to the deserialized response data of type T.
 * @throws {Error} If user is unauthenticated or the server returns an error response.
 */
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

/**
 * Sends an authenticated GET HTTP request to the specified API path.
 *
 * @template T - Expected JSON response payload type.
 * @param path - Relative API endpoint path.
 * @returns A promise resolving to the deserialized response data of type T.
 * @throws {Error} If user is unauthenticated or the server returns an error response.
 */
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

/**
 * Retrieves the current Two-Factor Authentication configuration status for the user.
 *
 * @returns A promise resolving to the TwoFAStatus object containing enablement and remaining backup codes.
 * @throws {Error} If unauthenticated or request fails.
 */
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

/**
 * Initiates the Two-Factor Authentication setup process, generating a secret key, URI, and backup codes.
 *
 * @returns A promise resolving to the setup details including secret, otpauthUri, and backup codes.
 * @throws {Error} If the setup initiation fails or secret is missing.
 */
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

/**
 * Verifies and activates Two-Factor Authentication using a 6-digit TOTP code.
 *
 * @param code - 6-digit TOTP verification code from the authenticator app.
 * @returns A promise resolving to the TwoFAEnabledResponse confirming 2FA activation.
 * @throws {Error} If the code is invalid or verification fails.
 */
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

/**
 * Disables Two-Factor Authentication on the user's account using password and TOTP/backup code.
 *
 * @param password - Account password for authentication confirmation.
 * @param code - TOTP verification code or emergency backup code.
 * @param isBackupCode - Optional boolean indicating whether `code` is an emergency backup code (default false).
 * @returns A promise resolving when 2FA has been successfully disabled.
 * @throws {Error} If disabling fails due to invalid password or code.
 */
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

