import Link from "next/link";
import { type JSX } from "react";
import { getServerApiUrl } from "@/lib/api/get-api-url";

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  readingTimeMinutes: number;
  createdAt: string;
}

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

export async function LatestPosts(): Promise<JSX.Element> {
  const posts = await getLatestPosts();

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-mono text-2xl font-bold text-green-400">Blog</h2>
          <Link
            href="/blog"
            className="font-mono text-xs text-neutral-500 transition-colors hover:text-green-400"
          >
            All posts →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="font-mono text-sm text-neutral-500">
            No posts yet.{" "}
            <Link
              href="/blog"
              className="text-green-400 hover:underline"
            >
              Visit the blog
            </Link>
          </p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 transition-colors hover:border-green-400/30"
                >
                  <h3 className="font-mono text-base font-semibold text-white group-hover:text-green-400">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="mt-2 line-clamp-2 font-mono text-xs text-neutral-400">
                      {post.summary}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-xs text-neutral-600">
                    {post.readingTimeMinutes} min read ·{" "}
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
