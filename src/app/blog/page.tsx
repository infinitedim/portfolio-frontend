import { Metadata } from "next";
import Link from "next/link";

/**
 * Get the backend URL for SSR data fetching
 */
function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"
  );
}

/**
 * Blog post item from API
 */
interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Blog list response from API
 */
interface BlogListResponse {
  items: BlogPostItem[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Generate metadata for the blog page
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog | Portfolio",
    description: "Read the latest articles and insights from our blog.",
    openGraph: {
      title: "Blog | Portfolio",
      description: "Read the latest articles and insights from our blog.",
      type: "website",
    },
  };
}

/**
 * Fetch blog posts from backend
 */
async function getBlogPosts(page = 1, pageSize = 10): Promise<BlogListResponse> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(
      `${backendUrl}/api/blog?page=${page}&pageSize=${pageSize}&published=true`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
  }

  return {
    items: [],
    page,
    pageSize,
    total: 0,
  };
}

/**
 * Blog list page - Server Component
 */
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 10;

  const { items: posts, total } = await getBlogPosts(page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-green-400 mb-4">Blog</h1>
          <p className="text-gray-400">
            Latest articles, tutorials, and insights.
          </p>
        </header>

        {/* Blog post list */}
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No blog posts yet. Check back soon!</p>
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
                  <p className="text-gray-400 mb-4">{post.summary}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/blog?page=${page - 1}`}
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
                href={`/blog?page=${page + 1}`}
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

// Enable ISR
export const revalidate = 3600; // Revalidate every hour
