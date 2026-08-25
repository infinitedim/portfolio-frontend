"use cache";

import { cacheLife } from "next/cache";
import { DEFAULT_BLOG_LOCALE } from "@/lib/i18n/locales";
import { getServerApiUrl } from "@/lib/api/get-api-url";

/**
 * Represents a summarized blog post item retrieved from the cached blog listing.
 *
 * @interface CachedBlogPostItem
 * @property {string} id - Unique identifier of the blog post.
 * @property {string} title - Title of the blog post.
 * @property {string} slug - Unique URL slug for routing.
 * @property {string | null} summary - Short synopsis or excerpt of the post.
 * @property {boolean} published - Publication visibility flag.
 * @property {string[]} tags - Categorical tags assigned to the post.
 * @property {number} readingTimeMinutes - Estimated reading time in minutes.
 * @property {string} createdAt - ISO 8601 creation timestamp string.
 * @property {string} updatedAt - ISO 8601 update timestamp string.
 */
export interface CachedBlogPostItem {
  /** Unique ID of the blog post. */
  id: string;
  /** Title header of the blog post. */
  title: string;
  /** URL-friendly slug identifier. */
  slug: string;
  /** Summary or excerpt text. */
  summary: string | null;
  /** Publication state flag. */
  published: boolean;
  /** Array of tag keywords. */
  tags: string[];
  /** Calculated reading duration in minutes. */
  readingTimeMinutes: number;
  /** ISO date string of post creation. */
  createdAt: string;
  /** ISO date string of latest modification. */
  updatedAt: string;
}

/**
 * Paginated response structure for cached blog post lists.
 *
 * @interface BlogListResponse
 * @property {CachedBlogPostItem[]} items - Array of summarized blog post items.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of items per page.
 * @property {number} total - Total count of available posts matching query.
 */
interface BlogListResponse {
  /** List of blog post entries for the current page. */
  items: CachedBlogPostItem[];
  /** 1-based page number. */
  page: number;
  /** Maximum number of records per page. */
  pageSize: number;
  /** Total number of published blog posts. */
  total: number;
}

/**
 * Fetches a cached, paginated list of published blog posts filtered by locale.
 * Uses Next.js caching directives (`cacheLife("hours")`) and tag-based revalidation.
 *
 * @async
 * @function getCachedBlogList
 * @param page - 1-based page number to fetch.
 * @param pageSize - Number of posts per page.
 * @param locale - Target language locale code.
 * @returns Paginated blog list response object.
 */
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

  try {
    const response = await fetch(
      `${getServerApiUrl()}/api/blog?${params.toString()}`,
      { next: { tags: ["blog-list", locale] } },
    );

    if (!response.ok) {
      return { items: [], page, pageSize, total: 0 };
    }

    return (await response.json()) as BlogListResponse;
  } catch (error) {
    console.error("Failed to fetch cached blog list:", error);
    return { items: [], page, pageSize, total: 0 };
  }
}

/**
 * Represents full details of an individual cached blog post, including markdown and HTML content.
 *
 * @interface CachedBlogPostDetail
 * @property {string} id - Unique identifier of the blog post.
 * @property {string} title - Title of the blog post.
 * @property {string} slug - URL slug identifier.
 * @property {string | null} summary - Excerpt or abstract.
 * @property {string | null} contentMd - Raw Markdown body content.
 * @property {string | null} contentHtml - Pre-rendered HTML representation of content.
 * @property {boolean} published - Publication status.
 * @property {string[]} tags - Associated topic tags.
 * @property {number} readingTimeMinutes - Estimated reading time in minutes.
 * @property {number} viewCount - Total views recorded for the article.
 * @property {string} [locale] - Language locale identifier (e.g., 'en', 'id').
 * @property {string | null} [translationGroupId] - UUID linking localized versions of this post.
 * @property {string} [translationStatus] - Localization lifecycle status.
 * @property {string} createdAt - ISO timestamp when the post was created.
 * @property {string} updatedAt - ISO timestamp when the post was last updated.
 */
export interface CachedBlogPostDetail {
  /** Unique ID of the blog post. */
  id: string;
  /** Title of the post. */
  title: string;
  /** Unique URL slug. */
  slug: string;
  /** Summary or excerpt. */
  summary: string | null;
  /** Raw Markdown text content. */
  contentMd: string | null;
  /** Compiled HTML content. */
  contentHtml: string | null;
  /** Publication state flag. */
  published: boolean;
  /** Array of classification tags. */
  tags: string[];
  /** Estimated reading time in minutes. */
  readingTimeMinutes: number;
  /** Total view counter. */
  viewCount: number;
  /** Language locale code. */
  locale?: string;
  /** Identifier grouping translated counterparts of this post. */
  translationGroupId?: string | null;
  /** Translation workflow status. */
  translationStatus?: string;
  /** ISO date string of post creation. */
  createdAt: string;
  /** ISO date string of post update. */
  updatedAt: string;
}

/**
 * Fetches a single blog post by slug and locale with Next.js caching enabled.
 *
 * @async
 * @function getCachedBlogPost
 * @param slug - The unique URL slug identifier of the article.
 * @param locale - Language locale code.
 * @returns The detailed blog post object, or null if not found or on failure.
 */
export async function getCachedBlogPost(
  slug: string,
  locale: string = DEFAULT_BLOG_LOCALE,
): Promise<CachedBlogPostDetail | null> {
  cacheLife("hours");

  const params = new URLSearchParams({ locale });
  try {
    const response = await fetch(
      `${getServerApiUrl()}/api/blog/${slug}?${params.toString()}`,
      { next: { tags: ["blog-post", slug, locale] } },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CachedBlogPostDetail;
  } catch (error) {
    console.error(`Failed to fetch cached blog post ${slug}:`, error);
    return null;
  }
}

/**
 * Retrieves all available published locale codes for a given post slug.
 *
 * @async
 * @function getPublishedLocalesForSlug
 * @param {string} slug - The URL slug of the post to find published translations for.
 * @returns {Promise<string[]>} Array of available locale codes (e.g. `['en', 'id']`), defaulting to `[DEFAULT_BLOG_LOCALE]`.
 */
export async function getPublishedLocalesForSlug(slug: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${getServerApiUrl()}/api/blog?published=true&pageSize=500`,
      { next: { revalidate: 3600, tags: ["blog-translations", slug] } },
    );

    if (!response.ok) {
      return [DEFAULT_BLOG_LOCALE];
    }

    const data = await response.json();
    const items: Array<{ slug: string; locale: string; translationStatus?: string }> =
      data.items || [];
    const matching = items.filter(
      (i) => i.slug === slug && (i.translationStatus === undefined || i.translationStatus === "published"),
    );

    const locales = Array.from(new Set(matching.map((i) => i.locale)));
    return locales.length > 0 ? locales : [DEFAULT_BLOG_LOCALE];
  } catch (error) {
    console.error(`Failed to fetch published locales for ${slug}:`, error);
    return [DEFAULT_BLOG_LOCALE];
  }
}

