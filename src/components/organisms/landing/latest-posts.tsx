import { type JSX } from "react";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import { LatestPostsClient } from "./latest-posts-client";

/**
 * Data model for a blog post retrieved from the backend API.
 */
interface BlogPostItem {
  /**
   * Unique identifier of the blog post.
   */
  id: string;
  /**
   * Article headline or title.
   */
  title: string;
  /**
   * URL slug for accessing the article.
   */
  slug: string;
  /**
   * Brief summary or excerpt of the post.
   */
  summary: string | null;
  /**
   * Estimated reading duration in minutes.
   */
  readingTimeMinutes: number;
  /**
   * ISO 8601 creation timestamp.
   */
  createdAt: string;
}

/**
 * Fetches the 3 most recently published blog posts from the backend API.
 *
 * @description
 * Queries the `/api/blog` endpoint with Next.js Incremental Static Regeneration (ISR)
 * caching (`revalidate: 3600`). Gracefully catches errors and falls back to an empty list.
 *
 * @returns A promise resolving to an array of up to 3 {@link BlogPostItem} objects.
 */
async function getLatestPosts(): Promise<BlogPostItem[]> {
  try {
    const backendUrl = getServerApiUrl();
    const response = await fetch(
      `${backendUrl}/api/blog?pageSize=3&published=true`,
      { next: { revalidate: 3600 } },
    );
    if (response.ok) {
      const data = await response.json();
      return data.items ?? [];
    }
  } catch (error) {
    console.error("Failed to fetch latest posts:", error);
  }
  return [];
}

/**
 * Server component that fetches and renders the latest blog posts section on the landing page.
 *
 * @description
 * Asynchronously retrieves the latest published blog posts from the backend service
 * and delegates rendering to {@link LatestPostsClient}.
 *
 * @returns A promise resolving to the rendered latest posts JSX element.
 */
export async function LatestPosts(): Promise<JSX.Element> {
  const posts = await getLatestPosts();

  return <LatestPostsClient posts={posts} />;
}
