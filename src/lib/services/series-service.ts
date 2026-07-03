import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";

export interface BlogSeriesSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogSeriesPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published: boolean;
  tags: string[];
  readingTimeMinutes: number;
  locale: string;
  seriesId: string | null;
  seriesOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogSeriesDetail extends BlogSeriesSummary {
  posts: BlogSeriesPost[];
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

export async function listPublicSeries(): Promise<BlogSeriesSummary[]> {
  const response = await fetch(`${apiBase()}/api/blog/series`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];
  return response.json();
}

export async function getPublicSeries(
  slug: string,
): Promise<BlogSeriesDetail | null> {
  const response = await fetch(`${apiBase()}/api/blog/series/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function listAdminSeries(): Promise<BlogSeriesSummary[]> {
  const response = await authedFetch("/api/admin/series");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load series");
  }
  return response.json();
}
