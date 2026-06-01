import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { getPublicSeries } from "@/lib/services/series-service";

const BUILD_PLACEHOLDER_SLUG = "__build_placeholder__";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    return { title: "Series | Blog" };
  }
  const series = await getPublicSeries(slug);
  if (!series) {
    return { title: "Series Not Found | Blog" };
  }
  return {
    title: `${series.title} | Blog Series`,
    description: series.description ?? `Posts in the ${series.title} series`,
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [{ slug: BUILD_PLACEHOLDER_SLUG }];
}

async function BlogSeriesContent({ params }: SeriesPageProps) {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    notFound();
  }

  const series = await getPublicSeries(slug);

  if (!series) {
    notFound();
  }

  return (
    <StandardPageLayout>
      <div className="min-h-screen bg-terminal-bg text-terminal-text">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <nav className="mb-6 font-mono">
            <Link
              href="/blog"
              className="text-terminal-accent transition-colors hover:text-terminal-accent/90"
            >
              ← Back to Blog
            </Link>
          </nav>

          <header className="mb-8">
            <p className="mb-2 text-xs uppercase tracking-wide text-terminal-muted font-mono">
              Series
            </p>
            <h1 className="mb-3 text-4xl font-bold text-terminal-accent">
              {series.title}
            </h1>
            {series.description && (
              <p className="text-terminal-muted">{series.description}</p>
            )}
            <p className="mt-2 text-sm text-terminal-muted font-mono">
              {series.posts.length} post{series.posts.length === 1 ? "" : "s"}
            </p>
          </header>

          {series.posts.length === 0 ? (
            <p className="text-center text-terminal-muted py-12 font-mono">
              No published posts in this series yet.
            </p>
          ) : (
            <ol className="space-y-6">
              {series.posts.map((post, index) => (
                <li
                  key={post.id}
                  className="rounded-lg border border-terminal-border p-6 transition-colors hover:border-terminal-accent/50"
                >
                  <div className="mb-2 flex items-center gap-3 text-sm text-terminal-muted font-mono">
                    <span className="text-terminal-accent/80">
                      Part {post.seriesOrder ?? index + 1}
                    </span>
                    {post.readingTimeMinutes > 0 && (
                      <span>{post.readingTimeMinutes} min read</span>
                    )}
                  </div>
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="mb-2 text-2xl font-semibold text-terminal-accent hover:text-terminal-accent/90">
                      {post.title}
                    </h2>
                  </Link>
                  {post.summary && (
                    <p className="mb-3 text-terminal-muted">{post.summary}</p>
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

function BlogSeriesSkeleton() {
  return (
    <StandardPageLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-gray-400">Loading series…</p>
      </div>
    </StandardPageLayout>
  );
}

export default function BlogSeriesPage(props: SeriesPageProps) {
  return (
    <Suspense fallback={<BlogSeriesSkeleton />}>
      <BlogSeriesContent {...props} />
    </Suspense>
  );
}
