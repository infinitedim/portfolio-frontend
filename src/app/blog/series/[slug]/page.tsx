import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { getPublicSeries } from "@/lib/services/series-service";
import { DEFAULT_BLOG_LOCALE } from "@/lib/i18n/locales";
import { getTranslationsForLocale } from "@/lib/i18n";

const BUILD_PLACEHOLDER_SLUG = "__build_placeholder__";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
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

async function BlogSeriesContent({ params, searchParams }: SeriesPageProps) {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    notFound();
  }

  const series = await getPublicSeries(slug);

  if (!series) {
    notFound();
  }

  const { locale: localeParam } = await searchParams;
  const locale = localeParam?.trim() || DEFAULT_BLOG_LOCALE;
  const t = getTranslationsForLocale(locale);

  return (
    <StandardPageLayout>
      <div className="min-h-screen bg-terminal-bg text-terminal-text">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <nav className="mb-6 font-mono text-sm">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>$ cd /blog</span>
            </Link>
          </nav>

          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>series.status :: {series.posts.length}_articles</span>
            </div>

            <div className="text-emerald-400/80 font-mono text-xs sm:text-sm mb-1">
              $ series --info {slug}
            </div>

            <h1 className="mb-3 text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight leading-tight">
              {series.title}
            </h1>
            {series.description && (
              <p className="text-neutral-400 max-w-3xl leading-relaxed text-sm sm:text-base mb-4">
                {series.description}
              </p>
            )}
          </header>

          {series.posts.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-8 text-center font-mono my-8">
              <p className="text-emerald-400 text-sm mb-2">$ grep --series={slug} --result=0</p>
              <p className="text-neutral-400 text-sm">
                {t.blogNoPostsInSeries}
              </p>
            </div>
          ) : (
            <div className="relative pl-4 sm:pl-8 border-l border-emerald-500/20 space-y-8 my-8">
              {series.posts.map((post, index) => {
                const partNumber = post.seriesOrder ?? index + 1;
                return (
                  <div key={post.id} className="relative group">
                    {/* Pipeline timeline node dot */}
                    <div className="absolute -left-[21px] sm:-left-[37px] top-6 w-3 h-3 rounded-full border-2 border-emerald-400 bg-neutral-950 group-hover:bg-emerald-400 transition-colors shadow-[0_0_10px_rgba(52,211,153,0.5)]" />

                    <article className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all duration-200 hover:border-emerald-400/40 shadow-xl">
                      <div className="mb-3 flex flex-wrap items-center gap-3 font-mono text-xs text-neutral-400">
                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                          [PART {String(partNumber).padStart(2, "0")}/{String(series.posts.length).padStart(2, "0")}]
                        </span>
                        {post.readingTimeMinutes > 0 && (
                          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                            {post.readingTimeMinutes} {t.blogMinRead}
                          </span>
                        )}
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="mb-2 text-xl font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {post.title}
                        </h2>
                      </Link>

                      {post.summary && (
                        <p className="mb-4 text-neutral-400 text-sm leading-relaxed">
                          {post.summary}
                        </p>
                      )}

                      {(post.tags?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <TagChip
                              key={tag}
                              name={tag}
                              size="sm"
                            />
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}

function BlogSeriesSkeleton() {
  const t = getTranslationsForLocale(DEFAULT_BLOG_LOCALE);
  return (
    <StandardPageLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-gray-400">{t.blogLoadingSeries}</p>
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
