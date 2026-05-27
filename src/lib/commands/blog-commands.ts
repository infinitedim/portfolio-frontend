import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { getApiUrl } from "@/lib/api/get-api-url";
import { getSiteUrl } from "@/lib/api/get-site-url";

interface BlogPostItem {
  title: string;
  slug: string;
  summary: string | null;
  readingTimeMinutes: number;
}

async function fetchRecentPosts(): Promise<BlogPostItem[]> {
  try {
    const response = await fetch(
      `${getApiUrl()}/api/blog?pageSize=5&published=true`,
    );
    if (response.ok) {
      const data = await response.json();
      return data.items ?? [];
    }
  } catch {
    // offline or backend unavailable
  }
  return [];
}

export const blogCommand: Command = {
  name: "blog",
  description: "Browse blog posts or open the blog in your browser",
  aliases: ["posts", "articles"],
  usage: "blog [read <slug>]",
  async execute(args: string[]): Promise<CommandOutput> {
    const sub = args[0]?.toLowerCase();

    if (sub === "read" && args[1]) {
      return blogReadCommand.execute(args.slice(1));
    }

    const posts = await fetchRecentPosts();
    const siteUrl = getSiteUrl();

    if (posts.length === 0) {
      return {
        type: "info",
        content: [
          "📰 Blog",
          "═".repeat(40),
          "",
          "No posts loaded. Visit the blog in your browser:",
          `  ${siteUrl}/blog`,
          "",
          "Usage: blog read <slug>",
        ].join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const lines = posts.map(
      (p) =>
        `  • ${p.title}\n    /blog/${p.slug} (${p.readingTimeMinutes} min)`,
    );

    return {
      type: "info",
      content: [
        "📰 Recent Blog Posts",
        "═".repeat(40),
        "",
        ...lines,
        "",
        `Full archive: ${siteUrl}/blog`,
        "Read a post: blog read <slug>",
      ].join("\n"),
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const blogReadCommand: Command = {
  name: "blog read",
  description: "Open a blog post by slug",
  async execute(args: string[]): Promise<CommandOutput> {
    const slug = args[0]?.trim();
    if (!slug) {
      return {
        type: "error",
        content: "Usage: blog read <slug>",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const url = `${getSiteUrl()}/blog/${slug}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    return {
      type: "success",
      content: `Opening ${url}`,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
