import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";

export const PORTFOLIO_SECTIONS = [
  "skills",
  "projects",
  "experience",
  "about",
] as const;

export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number];

export interface PortfolioVersionSummary {
  id: string;
  sectionKey: string;
  createdAt: string;
}

export interface RestorePortfolioResponse {
  success: boolean;
  sectionKey: string;
  restoredAt: string;
}

function apiBase(): string {
  return getApiUrl();
}

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
