import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";

/**
 * Summary representation of a blog series containing core metadata and total post count.
 */
export interface BlogSeriesSummary {
  /** Unique identifier of the blog series. */
  id: string;
  /** Display title of the series. */
  title: string;
  /** URL-friendly slug of the series. */
  slug: string;
  /** Optional summary or description of the series topic. */
  description: string | null;
  /** Total number of posts currently associated with this series. */
  postCount: number;
  /** ISO timestamp representing when the series was created. */
  createdAt: string;
  /** ISO timestamp representing when the series was last updated. */
  updatedAt: string;
}

/**
 * Metadata and details of a blog post associated with a series.
 */
export interface BlogSeriesPost {
  /** Unique identifier of the post. */
  id: string;
  /** Title of the post. */
  title: string;
  /** URL-friendly slug of the post. */
  slug: string;
  /** Short summary or excerpt of the post content. */
  summary: string | null;
  /** Publication status flag indicating whether the post is publicly accessible. */
  published: boolean;
  /** List of categorical tags assigned to the post. */
  tags: string[];
  /** Estimated reading time in minutes. */
  readingTimeMinutes: number;
  /** Locale/language code of the post (e.g., 'en', 'id'). */
  locale: string;
  /** Unique identifier of the parent series, if any. */
  seriesId: string | null;
  /** Positional index/order of the post within its series. */
  seriesOrder: number | null;
  /** ISO timestamp representing when the post was created. */
  createdAt: string;
  /** ISO timestamp representing when the post was last updated. */
  updatedAt: string;
}

/**
 * Detailed representation of a blog series including summary metadata and its collection of posts.
 */
export interface BlogSeriesDetail extends BlogSeriesSummary {
  /** Ordered list of blog posts included in this series. */
  posts: BlogSeriesPost[];
}

/**
 * Retrieves the base URL for API endpoint requests.
 *
 * @returns Base API URL string.
 */
function apiBase(): string {
  return getApiUrl();
}

/**
 * Performs an authenticated HTTP fetch request with automatic bearer token attachment
 * and token refreshing if necessary.
 *
 * @param path - Target API endpoint path relative to the base URL.
 * @param init - Optional RequestInit configuration for the fetch request.
 * @returns A promise resolving to the fetch Response object.
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
 * Retrieves all publicly available blog series summaries.
 *
 * @returns A promise resolving to an array of public blog series summaries. Returns an empty array on error.
 */
export async function listPublicSeries(): Promise<BlogSeriesSummary[]> {
  try {
    const response = await fetch(`${apiBase()}/api/blog/series`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error("Failed to list public series:", error);
    return [];
  }
}

/**
 * Retrieves detailed information and associated posts for a specific public blog series by slug.
 *
 * @param slug - URL-friendly slug identifier of the series.
 * @returns A promise resolving to the detailed blog series or null if not found/error occurs.
 */
export async function getPublicSeries(
  slug: string,
): Promise<BlogSeriesDetail | null> {
  try {
    const response = await fetch(`${apiBase()}/api/blog/series/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Failed to get public series ${slug}:`, error);
    return null;
  }
}

/**
 * Retrieves all blog series summaries for administrative management.
 *
 * @returns A promise resolving to an array of blog series summaries.
 * @throws {Error} If the API request fails or returns an error status.
 */
export async function listAdminSeries(): Promise<BlogSeriesSummary[]> {
  const response = await authedFetch("/api/admin/series");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load series");
  }
  return response.json();
}

/**
 * Creates a new blog series under administrative permissions.
 *
 * @param data - The blog series creation payload.
 * @param data.title - Title of the new series.
 * @param data.slug - URL-friendly unique slug for the series.
 * @param data.description - Optional description or overview of the series.
 * @returns A promise resolving to the created blog series summary.
 * @throws {Error} If the API request fails or returns an error status.
 */
export async function createAdminSeries(data: {
  title: string;
  slug: string;
  description?: string;
}): Promise<BlogSeriesSummary> {
  const response = await authedFetch("/api/admin/series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create series");
  }
  return response.json();
}

/**
 * Updates an existing blog series by its ID under administrative permissions.
 *
 * @param id - Unique identifier of the blog series to update.
 * @param data - Partial series data fields to update.
 * @param data.title - Optional updated title for the series.
 * @param data.slug - Optional updated slug for the series.
 * @param data.description - Optional updated description for the series.
 * @returns A promise resolving to the updated blog series summary.
 * @throws {Error} If the API request fails or returns an error status.
 */
export async function updateAdminSeries(
  id: string,
  data: { title?: string; slug?: string; description?: string },
): Promise<BlogSeriesSummary> {
  const response = await authedFetch(`/api/admin/series/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update series");
  }
  return response.json();
}

/**
 * Deletes an existing blog series by its ID under administrative permissions.
 *
 * @param id - Unique identifier of the blog series to delete.
 * @returns A promise that resolves when deletion is complete.
 * @throws {Error} If the API request fails or returns an error status.
 */
export async function deleteAdminSeries(id: string): Promise<void> {
  const response = await authedFetch(`/api/admin/series/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete series");
  }
}

