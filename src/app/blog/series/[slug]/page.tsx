import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { getPublicSeries } from "@/lib/services/series-service";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getPublicSeries(slug);
  if (!series) {
    return { title: "Series Not Found | Blog" };
  }
  return {
    title: `${series.title} | Blog Series`,
    description: series.description ?? `Posts in the ${series.title} series`,
  };
}

export default async function BlogSeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params;
  const series = await getPublicSeries(slug);

  if (!series) {
    notFound();
  }

  return (
    <StandardPageLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <nav className="mb-6">
            <Link
              href="/blog"
              className="text-green-400 transition-colors hover:text-green-300"
            >
              ← Back to Blog
            </Link>
          </nav>

          <header className="mb-8">
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
              Series
            </p>
            <h1 className="mb-3 text-4xl font-bold text-green-400">
              {series.title}
            </h1>
            {series.description && (
              <p className="text-gray-400">{series.description}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              {series.posts.length} post{series.posts.length === 1 ? "" : "s"}
            </p>
          </header>

          {series.posts.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No published posts in this series yet.
            </p>
          ) : (
            <ol className="space-y-6">
              {series.posts.map((post, index) => (
                <li
                  key={post.id}
                  className="rounded-lg border border-gray-800 p-6 transition-colors hover:border-green-400/50"
                >
                  <div className="mb-2 flex items-center gap-3 text-sm text-gray-500">
                    <span className="font-mono text-green-400/80">
                      Part {post.seriesOrder ?? index + 1}
                    </span>
                    {post.readingTimeMinutes > 0 && (
                      <span>{post.readingTimeMinutes} min read</span>
                    )}
                  </div>
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="mb-2 text-2xl font-semibold text-green-400 hover:text-green-300">
                      {post.title}
                    </h2>
                  </Link>
                  {post.summary && (
                    <p className="mb-3 text-gray-400">{post.summary}</p>
                  )}
                  {(post.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <TagChip
                          key={tag}
                          name={tag}
                          size="sm"
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}

export const revalidate = 3600;
