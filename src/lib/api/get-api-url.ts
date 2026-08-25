/**
 * Fallback backend API URL used when environment variables are not configured.
 */
const DEFAULT_API_URL = "http://localhost:8080";

/**
 * Resolves the primary backend API base URL based on environment configuration.
 * Checks `NEXT_PUBLIC_API_URL`, then `BACKEND_URL`, falling back to `http://localhost:8080`.
 *
 * @returns {string} The resolved API base URL.
 *
 * @example
 * ```ts
 * const apiUrl = getApiUrl();
 * const response = await fetch(`${apiUrl}/api/projects`);
 * ```
 */
export function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.BACKEND_URL ??
    DEFAULT_API_URL
  );
}

/**
 * Resolves the backend API base URL specifically for server-side environments (e.g., Server Components, API routes).
 * Prefers `BACKEND_URL` before falling back to `getApiUrl()`.
 *
 * @returns {string} The resolved server-side API URL.
 *
 * @example
 * ```ts
 * const serverApiUrl = getServerApiUrl();
 * ```
 */
export function getServerApiUrl(): string {
  return process.env.BACKEND_URL ?? getApiUrl();
}
