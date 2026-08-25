import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  TagFilter,
  type TagWithCount,
} from "@/components/molecules/blog/tag-filter";
import { SeriesFilter } from "@/components/molecules/blog/series-filter";
import { BlogLocaleSwitcher } from "@/components/molecules/blog/locale-switcher";
import { BlogEmptyState } from "@/components/molecules/blog/blog-empty-state";
import { listPublicSeries } from "@/lib/services/series-service";
import { DEFAULT_BLOG_LOCALE } from "@/lib/i18n/locales";
import { TagChip } from "@/components/atoms/shared/tag-chip";

import { getServerApiUrl } from "@/lib/api/get-api-url";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PageHeader } from "@/components/atoms/shared/page-header";
import { getCachedBlogList } from "@/lib/services/cached-blog-fetch";
import { getTranslationsForLocale } from "@/lib/i18n";

function getBackendUrl(): string {
  return getServerApiUrl();
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

interface BlogPageMetadataProps {
  searchParams: Promise<{
    locale?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: BlogPageMetadataProps): Promise<Metadata> {
  const { locale: localeParam } = await searchParams;
  const locale = localeParam?.trim() || DEFAULT_BLOG_LOCALE;
  const canonicalPath =
    locale === DEFAULT_BLOG_LOCALE ? "/blog" : `/blog?locale=${locale}`;

  return {
    title: "Blog | Portfolio",
    description: "Read the latest articles and insights from our blog.",
    openGraph: {
      title: "Blog | Portfolio",
      description: "Read the latest articles and insights from our blog.",
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_US",
      alternateLocale: locale === "id" ? ["en_US"] : ["id_ID"],
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: "/blog",
        id: "/blog?locale=id",
        "x-default": "/blog",
      },
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
  series?: string,
  locale?: string,
): Promise<BlogListResponse> {
  const resolvedLocale = locale ?? DEFAULT_BLOG_LOCALE;

  if (!search && !tag && !series && page === 1) {
    return getCachedBlogList(page, pageSize, resolvedLocale);
  }

  try {
    const backendUrl = getBackendUrl();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      published: "true",
    });
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);
    if (series) params.set("series", series);
    if (locale && locale !== DEFAULT_BLOG_LOCALE) params.set("locale", locale);

    const response = await fetch(
      `${backendUrl}/api/blog?${params.toString()}`,
      {
        next: { revalidate: 3600 },
      },
    );

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

async function BlogPageContent({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tag?: string;
    series?: string;
    locale?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 10;
  const search = params.search?.trim() || undefined;
  const tag = params.tag?.trim() || undefined;
  const series = params.series?.trim() || undefined;
  const locale = params.locale?.trim() || DEFAULT_BLOG_LOCALE;

  const t = getTranslationsForLocale(locale);

  const [{ items: posts, total }, availableTags, seriesList] =
    await Promise.all([
      getBlogPosts(page, pageSize, search, tag, series, locale),
      getAvailableTags(),
      listPublicSeries(),
    ]);
  const totalPages = Math.ceil(total / pageSize);

  const buildUrl = (overrides: {
    page?: number;
    search?: string;
    tag?: string;
    series?: string;
    locale?: string;
  }): Route => {
    const p = new URLSearchParams();
    const newPage = overrides.page ?? page;
    const newSearch = "search" in overrides ? overrides.search : search;
    const newTag = "tag" in overrides ? overrides.tag : tag;
    const newSeries = "series" in overrides ? overrides.series : series;
    const newLocale = "locale" in overrides ? overrides.locale : locale;
    if (newPage > 1) p.set("page", String(newPage));
    if (newSearch) p.set("search", newSearch);
    if (newTag) p.set("tag", newTag);
    if (newSeries) p.set("series", newSeries);
    if (newLocale && newLocale !== DEFAULT_BLOG_LOCALE) {
      p.set("locale", newLocale);
    }
    const qs = p.toString();
    return (qs ? `/blog?${qs}` : "/blog") as Route;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="blog"
        description={t.blogLatestArticles}
        actions={
          <div className="flex items-center gap-3">
            <BlogLocaleSwitcher />
            <a
              href="/rss.xml"
              className="text-xs text-neutral-400 hover:text-orange-400 border border-neutral-800 hover:border-orange-400/40 transition-colors duration-200 px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-1.5 bg-neutral-900/90"
            >
              <span className="text-orange-400 font-bold">$</span>
              <span>RSS</span>
            </a>
          </div>
        }
      />

      <form
        method="GET"
        action="/blog"
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder={t.blogSearchPlaceholder}
          className="flex-1 rounded border border-(--terminal-border) bg-(--terminal-bg)/90 px-3 py-2 text-sm text-(--terminal-text) font-mono outline-none transition-colors duration-200"
        />
        {tag && (
          <input
            type="hidden"
            name="tag"
            value={tag}
          />
        )}
        {series && (
          <input
            type="hidden"
            name="series"
            value={series}
          />
        )}
        {locale !== DEFAULT_BLOG_LOCALE && (
          <input
            type="hidden"
            name="locale"
            value={locale}
          />
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded border border-(--terminal-accent)/40 bg-(--terminal-accent)/10 text-(--terminal-accent) text-sm font-mono transition-colors duration-200 hover:bg-(--terminal-accent)/20 cursor-pointer"
        >
          {t.blogSearchButton}
        </button>
        {(search || tag || series) && (
          <Link
            href={buildUrl({
              page: 1,
              search: undefined,
              tag: undefined,
              series: undefined,
            })}
            className="px-4 py-2 rounded border border-(--terminal-border) text-(--terminal-muted) text-sm font-mono transition-colors duration-200 hover:border-(--terminal-accent)/40 hover:text-(--terminal-text)"
          >
            {t.blogClearButton}
          </Link>
        )}
      </form>

      <SeriesFilter
        series={seriesList}
        activeSeries={series}
        search={search}
      />

      {availableTags.length > 0 && (
        <TagFilter
          tags={availableTags}
          activeTag={tag}
          searchParam={search}
        />
      )}

      {posts.length === 0 ? (
        <BlogEmptyState
          search={search}
          tag={tag}
          series={series}
          resetUrl={buildUrl({
            page: 1,
            search: undefined,
            tag: undefined,
            series: undefined,
          })}
          t={t}
        />
      ) : (
        <div className="space-y-8 font-mono">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/70 p-6 transition-colors duration-200 hover:border-(--terminal-accent)/60 border-l-2 border-l-(--terminal-accent)/50"
            >
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold font-mono text-(--terminal-text) transition-colors duration-200 group-hover:text-(--terminal-accent) mb-2">
                  {post.title}
                </h2>
              </Link>
              {post.summary && (
                <p className="text-(--terminal-muted) mb-3">{post.summary}</p>
              )}
              {(post.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags!.map((t) => (
                    <Link
                      key={t}
                      href={buildUrl({ tag: t, page: 1 })}
                    >
                      <TagChip
                        key={t}
                        name={t}
                        size="sm"
                        active={t === tag}
                      />
                    </Link>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between font-mono text-xs text-(--terminal-muted)">
                <div className="flex items-center gap-3">
                  <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {post.readingTimeMinutes > 0 && (
                    <span>
                      {post.readingTimeMinutes} {t.blogMinRead}
                    </span>
                  )}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-mono text-xs text-(--terminal-accent) transition-colors duration-200 hover:opacity-80"
                >
                  {t.blogReadMore}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex justify-center gap-2 font-mono">
          {page > 1 && (
            <Link
              href={buildUrl({ page: page - 1 })}
              className="inline-flex items-center gap-1 px-4 py-2 rounded border border-(--terminal-border) font-mono text-sm text-(--terminal-muted) transition-colors duration-200 hover:border-(--terminal-accent)/60 hover:text-(--terminal-accent)"
            >
              <ChevronLeft size={14} />
              {t.previous}
            </Link>
          )}
          <span className="px-4 py-2 text-(--terminal-muted)">
            {t.blogPageOf
              .replace("{page}", String(page))
              .replace("{totalPages}", String(totalPages))}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl({ page: page + 1 })}
              className="inline-flex items-center gap-1 px-4 py-2 rounded border border-(--terminal-border) font-mono text-sm text-(--terminal-muted) transition-colors duration-200 hover:border-(--terminal-accent)/60 hover:text-(--terminal-accent)"
            >
              {t.next}
              <ChevronRight size={14} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function BlogListSkeleton() {
  const t = getTranslationsForLocale(DEFAULT_BLOG_LOCALE);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-neutral-400 font-mono">{t.blogLoadingBlog}</p>
    </div>
  );
}

export default function BlogPage(props: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tag?: string;
    series?: string;
    locale?: string;
  }>;
}) {
  return (
    <StandardPageLayout>
      <Suspense fallback={<BlogListSkeleton />}>
        <BlogPageContent {...props} />
      </Suspense>
    </StandardPageLayout>
  );
}
