import { Metadata } from "next";
import Link from "next/link";
import {
  TagFilter,
  type TagWithCount,
} from "@/components/molecules/blog/tag-filter";
import { TagChip } from "@/components/atoms/shared/tag-chip";

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"
  );
}

interface BlogPostItem {
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
  items: BlogPostItem[];
  page: number;
  pageSize: number;
  total: number;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog | Portfolio",
    description: "Read the latest articles and insights from our blog.",
    openGraph: {
      title: "Blog | Portfolio",
      description: "Read the latest articles and insights from our blog.",
      type: "website",
    },
    alternates: {
      types: {
        "application/rss+xml": "/rss.xml",
      },
    },
  };
}

async function getBlogPosts(
  page = 1,
  pageSize = 10,
  search?: string,
  tag?: string,
): Promise<BlogListResponse> {
  try {
    const backendUrl = getBackendUrl();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      published: "true",
    });
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);

    const response = await fetch(`${backendUrl}/api/blog?${params.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
  }

  return { items: [], page, pageSize, total: 0 };
}

async function getAvailableTags(): Promise<TagWithCount[]> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/blog/tags`, {
      next: { revalidate: 3600 },
    });
    if (response.ok) {
      const data = await response.json();
      // Support both old format { tags: string[] } and new format TagWithCount[]
      if (Array.isArray(data)) {
        return data as TagWithCount[];
      }
      if (data.tags && Array.isArray(data.tags)) {
        return data.tags.map((t: string) => ({
          name: t,
          slug: t.toLowerCase().replace(/\s+/g, "-"),
          postCount: 0,
        }));
      }
    }
  } catch (error) {
    console.error("Failed to fetch tags:", error);
  }
  return [];
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 10;
  const search = params.search?.trim() || undefined;
  const tag = params.tag?.trim() || undefined;

  const [{ items: posts, total }, availableTags] = await Promise.all([
    getBlogPosts(page, pageSize, search, tag),
    getAvailableTags(),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  const buildUrl = (overrides: { page?: number; search?: string; tag?: string }): never => {
    const p = new URLSearchParams();
    const newPage = overrides.page ?? page;
    const newSearch = "search" in overrides ? overrides.search : search;
    const newTag = "tag" in overrides ? overrides.tag : tag;
    if (newPage > 1) p.set("page", String(newPage));
    if (newSearch) p.set("search", newSearch);
    if (newTag) p.set("tag", newTag);
    const qs = p.toString();
    return `/blog${qs ? `?${qs}` : ""}` as never;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-green-400">Blog</h1>
            <a
              href="/rss.xml"
              className="text-xs text-gray-500 hover:text-orange-400 transition-colors border border-gray-700 hover:border-orange-400 px-2 py-1 rounded"
            >
              RSS
            </a>
          </div>
          <p className="text-gray-400 mb-6">
            Latest articles, tutorials, and insights.
          </p>

          <form method="GET" action="/blog" className="flex gap-2 mb-4">
            <input
              type="text"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search posts..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-green-400"
            />
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button
              type="submit"
              className="px-4 py-2 bg-green-400/10 border border-green-400/40 text-green-400 rounded text-sm hover:bg-green-400/20 transition-colors"
            >
              Search
            </button>
            {(search || tag) && (
              <Link
                href="/blog"
                className="px-4 py-2 border border-gray-700 text-gray-400 rounded text-sm hover:border-gray-500 transition-colors"
              >
                Clear
              </Link>
            )}
          </form>

          {availableTags.length > 0 && (
            <TagFilter
              tags={availableTags}
              activeTag={tag}
              searchParam={search}
            />
          )}
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search || tag ? (
              <p>
                No posts found for{" "}
                {search && <span>&ldquo;{search}&rdquo;</span>}
                {search && tag && " in "}
                {tag && <span className="text-green-400">#{tag}</span>}.{" "}
                <Link href="/blog" className="text-green-400 hover:underline">
                  View all posts
                </Link>
              </p>
            ) : (
              <p>No blog posts yet. Check back soon!</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border border-gray-800 rounded-lg p-6 hover:border-green-400/50 transition-colors"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-semibold text-green-400 hover:text-green-300 mb-2">
                    {post.title}
                  </h2>
                </Link>
                {post.summary && (
                  <p className="text-gray-400 mb-3">{post.summary}</p>
                )}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map((t) => (
                      <Link
                        key={t}
                        href={buildUrl({ tag: t, page: 1 })}
                      >
                        <TagChip name={t} size="sm" active={t === tag} />
                      </Link>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-3">
                    <time dateTime={post.createdAt}>
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    {post.readingTimeMinutes > 0 && (
                      <span>{post.readingTimeMinutes} min read</span>
                    )}
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-green-400 hover:text-green-300"
                  >
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: page - 1 })}
                className="px-4 py-2 border border-gray-700 rounded hover:border-green-400 transition-colors"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildUrl({ page: page + 1 })}
                className="px-4 py-2 border border-gray-700 rounded hover:border-green-400 transition-colors"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}

export const revalidate = 3600;
