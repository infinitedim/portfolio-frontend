import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import { getSiteUrl } from "@/lib/api/get-site-url";

/**
 * Sanitizes and escapes reserved XML characters in a string.
 *
 * @param {string} text - The input plain text string to escape.
 * @returns {string} The escaped text safe for XML insertion.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Represents a blog post item payload fetched from the backend API for RSS generation.
 *
 * @interface BlogPostItem
 * @property {string} id - Unique identifier of the post.
 * @property {string} title - Title of the blog post.
 * @property {string} slug - URL slug identifier of the blog post.
 * @property {string | null} summary - Short excerpt or synopsis of the post content.
 * @property {string[]} tags - Categorization tags associated with the post.
 * @property {number} readingTimeMinutes - Estimated reading time in minutes.
 * @property {string} createdAt - ISO date string when the post was created.
 * @property {string} updatedAt - ISO date string when the post was last modified.
 */
interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  tags: string[];
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * HTTP GET route handler that generates an RSS 2.0 XML feed of published blog posts.
 *
 * @description Fetches the latest published blog articles from the backend API, formats them
 * into RSS 2.0 XML channel items with escaped XML fields, categories, links, and publication dates,
 * and responds with appropriate XML headers and caching directives.
 *
 * @async
 * @returns {Promise<NextResponse>} The HTTP response containing the RSS 2.0 XML feed.
 */
export async function GET(): Promise<NextResponse> {
  const siteUrl = getSiteUrl();
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE ?? "Portfolio Blog";
  const siteDescription =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ?? "Latest articles and insights";

  let posts: BlogPostItem[] = [];

  try {
    const backendUrl = getServerApiUrl();
    const response = await fetch(
      `${backendUrl}/api/blog?published=true&pageSize=50&sort=updated`,
      { next: { revalidate: 3600 } },
    );
    if (response.ok) {
      const data: { items: BlogPostItem[] } = await response.json();
      posts = data.items;
    }
  } catch (error) {
    console.error("RSS: failed to fetch posts", error);
  }

  const items = posts
    .map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.createdAt).toUTCString();
      const summary = post.summary ? escapeXml(post.summary) : "";
      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${summary}</description>
${categories}
    </item>`;
    })
    .join("\n");

  const lastBuildDate =
    posts.length > 0
      ? new Date(posts[0].updatedAt).toUTCString()
      : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=300",
    },
  });
}
