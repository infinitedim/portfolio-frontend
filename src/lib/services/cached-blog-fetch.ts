"use cache";

import { cacheLife } from "next/cache";
import { DEFAULT_BLOG_LOCALE } from "@/lib/i18n/locales";
import { getServerApiUrl } from "@/lib/api/get-api-url";

export interface CachedBlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published: boolean;
  tags: string[];
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogListResponse {
  items: CachedBlogPostItem[];
  page: number;
  pageSize: number;
  total: number;
}

export async function getCachedBlogList(
  page = 1,
  pageSize = 10,
  locale: string = DEFAULT_BLOG_LOCALE,
): Promise<BlogListResponse> {
  cacheLife("hours");

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    published: "true",
    locale,
  });

  const response = await fetch(
    `${getServerApiUrl()}/api/blog?${params.toString()}`,
    { next: { tags: ["blog-list", locale] } },
  );

  if (!response.ok) {
    return { items: [], page, pageSize, total: 0 };
  }

  return (await response.json()) as BlogListResponse;
}

export interface CachedBlogPostDetail {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentMd: string | null;
  contentHtml: string | null;
  published: boolean;
  tags: string[];
  readingTimeMinutes: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function getCachedBlogPost(
  slug: string,
  locale: string = DEFAULT_BLOG_LOCALE,
): Promise<CachedBlogPostDetail | null> {
  cacheLife("hours");

  const params = new URLSearchParams({ locale });
  const response = await fetch(
    `${getServerApiUrl()}/api/blog/${slug}?${params.toString()}`,
    { next: { tags: ["blog-post", slug, locale] } },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as CachedBlogPostDetail;
}
