import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";

/**
 * Array of editable portfolio section keys available in the admin panel.
 */
export const PORTFOLIO_SECTIONS = [
  "skills",
  "projects",
  "experience",
  "about",
] as const;

/**
 * Type representing valid portfolio section identifier keys.
 */
export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number];

/**
 * Summary record of a saved portfolio section version snapshot.
 */
export interface PortfolioVersionSummary {
  /** Unique version snapshot identifier. */
  id: string;
  /** Identifier of the portfolio section associated with this version. */
  sectionKey: string;
  /** ISO date string when this version snapshot was created. */
  createdAt: string;
}

/**
 * Response payload returned after successfully restoring a portfolio section version.
 */
export interface RestorePortfolioResponse {
  /** Indicates whether the restoration completed successfully. */
  success: boolean;
  /** Key of the restored portfolio section. */
  sectionKey: string;
  /** ISO timestamp when the version was restored. */
  restoredAt: string;
}

/**
 * Resolves the base URL for the backend API.
 *
 * @returns The base API endpoint URL.
 */
function apiBase(): string {
  return getApiUrl();
}

/**
 * Executes an authenticated fetch request appending Bearer access token headers.
 *
 * @param path - Relative API route path.
 * @param init - Optional RequestInit configuration options.
 * @returns Promise resolving to the fetch Response.
 * @throws {Error} If authentication token is missing or refresh fails.
 */
async function authedFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let token = authService.getAccessToken();
  if (!token) {
    const refreshed = await authService.refresh();
    if (refreshed.success) {
      token = authService.getAccessToken();
    }
  }
  if (!token) {
    throw new Error("Authentication required");
  }
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    credentials: "include",
  });
}

/**
 * Retrieves the historical version snapshot list for a specific portfolio section.
 *
 * @param section - Target portfolio section key.
 * @returns Promise resolving to an array of version snapshot summaries.
 * @throws {Error} If request is unauthorized or retrieval fails.
 */
export async function listPortfolioVersions(
  section: PortfolioSection,
): Promise<PortfolioVersionSummary[]> {
  const response = await authedFetch(
    `/api/admin/portfolio/versions?section=${encodeURIComponent(section)}`,
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load version history");
  }
  return response.json();
}

/**
 * Restores a specific historical portfolio section version snapshot by ID.
 *
 * @param versionId - Unique identifier of the version snapshot to restore.
 * @returns Promise resolving to the restore confirmation response.
 * @throws {Error} If request is unauthorized or restoration fails.
 */
export async function restorePortfolioVersion(
  versionId: string,
): Promise<RestorePortfolioResponse> {
  const response = await authedFetch(
    `/api/admin/portfolio/versions/${versionId}/restore`,
    { method: "POST" },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to restore version");
  }
  return response.json();
}
