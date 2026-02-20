import { NextResponse } from "next/server";

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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

export async function GET(): Promise<NextResponse> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE ?? "Portfolio Blog";
  const siteDescription =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ?? "Latest articles and insights";

  let posts: BlogPostItem[] = [];

  try {
    const backendUrl = getBackendUrl();
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

export const revalidate = 3600;
