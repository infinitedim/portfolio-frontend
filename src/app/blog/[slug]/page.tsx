import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ScrollProgress } from "@/components/molecules/blog/scroll-progress";
import { BackToTop } from "@/components/molecules/blog/back-to-top";
import { CopyCodeButton } from "@/components/molecules/blog/copy-code-button";
import { ShareButtons } from "@/components/molecules/blog/share-buttons";
import { TableOfContents } from "@/components/molecules/blog/table-of-contents";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { GiscusComments } from "@/components/molecules/blog/giscus-comments-dynamic";
import { BlogContent } from "@/components/molecules/blog/blog-content";

import { getServerApiUrl } from "@/lib/api/get-api-url";
import { ArticleSchema, BreadcrumbListSchema } from "@/components/molecules/seo/json-ld";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { addHeadingIdsToHtml } from "@/lib/blog/html-headings";
import { BlogLocaleSwitcher } from "@/components/molecules/blog/locale-switcher";
import { DEFAULT_BLOG_LOCALE } from "@/lib/i18n/locales";
import {
  getCachedBlogPost,
  getPublishedLocalesForSlug,
} from "@/lib/services/cached-blog-fetch";
import { getTranslationsForLocale } from "@/lib/i18n";

const BUILD_PLACEHOLDER_SLUG = "__build_placeholder__";

function getBackendUrl(): string {
  return getServerApiUrl();
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentMd: string | null;
  contentHtml: string | null;
  published: boolean;
  tags: string[];
  readingTimeMinutes: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}

async function getBlogPost(
  slug: string,
  locale: string = DEFAULT_BLOG_LOCALE,
): Promise<BlogPost | null> {
  return getCachedBlogPost(slug, locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug, DEFAULT_BLOG_LOCALE);

  if (!post) {
    return {
      title: "Post Not Found | Blog",
      description: "The requested blog post could not be found.",
    };
  }

  const canonicalPath = `/blog/${post.slug}`;

  const publishedLocales = await getPublishedLocalesForSlug(post.slug);
  const languageAlternates: Record<string, string> = {
    "x-default": `/blog/${post.slug}`,
    en: `/blog/${post.slug}`,
  };

  for (const loc of publishedLocales) {
    if (loc === "en" || loc === "en_US") continue;
    const isoCode = loc.replace("_", "-");
    languageAlternates[isoCode] = `/blog/${post.slug}?locale=${loc}`;
  }

  return {
    title: `${post.title} | Blog`,
    description: post.summary ?? post.title,
    authors: [{ name: "Dimas Saputra" }],
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates,
    },

    openGraph: {
      title: post.title,
      description: post.summary ?? post.title,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      locale: "en_US",
      alternateLocale: ["id_ID"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary ?? post.title,
    },
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(
      `${backendUrl}/api/blog?pageSize=100&published=true`,
      { next: { revalidate: 3600 } },
    );

    if (response.ok) {
      const data = await response.json();
      const slugs = (data.items || []).map((post: { slug: string }) => ({
        slug: post.slug,
      }));
      if (slugs.length > 0) {
        return slugs;
      }
    }
  } catch (error) {
    console.error("Failed to generate static params:", error);
  }

  // cacheComponents requires at least one param for build-time validation
  return [{ slug: BUILD_PLACEHOLDER_SLUG }];
}

function BlogPostSkeleton() {
  const t = getTranslationsForLocale(DEFAULT_BLOG_LOCALE);
  return (
    <StandardPageLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-gray-400">{t.blogLoadingPost}</p>
      </div>
    </StandardPageLayout>
  );
}

async function BlogPostContent({ params, searchParams }: BlogPostPageProps) {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    notFound();
  }

  const { locale: localeParam } = await searchParams;
  const locale = localeParam?.trim() || DEFAULT_BLOG_LOCALE;
  const post = await getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  if (!post.published) {
    notFound();
  }

  const t = getTranslationsForLocale(locale);

  const contentHtml = post.contentHtml
    ? addHeadingIdsToHtml(post.contentHtml)
    : null;

  const schemaUrl =
    locale === DEFAULT_BLOG_LOCALE
      ? `https://infinitedim.dev/blog/${post.slug}`
      : `https://infinitedim.dev/blog/${post.slug}?locale=${locale}`;
  const inLanguage = locale === "id" ? "id-ID" : "en-US";

  return (
    <StandardPageLayout>
      <ArticleSchema
        headline={post.title}
        description={post.summary || post.title}
        author="Dimas Saputra"
        publisher="infinitedim"
        datePublished={post.createdAt}
        dateModified={post.updatedAt}
        url={schemaUrl}
        keywords={post.tags?.join(", ")}
        inLanguage={inLanguage}
      />
      <BreadcrumbListSchema
        items={[
          { name: "Home", item: "https://infinitedim.dev" },
          { name: "Blog", item: "https://infinitedim.dev/blog" },
          { name: post.title, item: `https://infinitedim.dev/blog/${post.slug}` },
        ]}
      />
      <div className="min-h-screen bg-terminal-bg text-terminal-text">
        <ScrollProgress />

        <div className="mx-auto max-w-6xl px-4 py-8">
          <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between font-mono text-sm">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>$ cd /blog</span>
            </Link>
            <BlogLocaleSwitcher slug={slug} />
          </nav>

          {contentHtml && (
            <div className="lg:hidden mb-8">
              <TableOfContents contentHtml={contentHtml} />
            </div>
          )}

          <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-8 lg:items-start">
            <article className="prose prose-invert max-w-none min-w-0">
              <header className="mb-8 not-prose">
                {/* Status Pill Header */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>post.status :: published</span>
                </div>

                <div className="text-emerald-400/80 font-mono text-xs sm:text-sm mb-2">
                  $ cat /blog/{post.slug}.md
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight mb-4 leading-tight">
                  {post.title}
                </h1>

                {post.summary && (
                  <p className="text-lg text-neutral-300 mb-5 leading-relaxed">
                    {post.summary}
                  </p>
                )}

                {(post.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {post.tags!.map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}` as never}
                      >
                        <TagChip
                          name={tag}
                          size="sm"
                        />
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono pt-3 border-t border-neutral-800/80">
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                    {t.blogPublishedPrefix}
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {post.updatedAt !== post.createdAt && (
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      {t.blogUpdatedPrefix}
                      {new Date(post.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  {post.readingTimeMinutes > 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {post.readingTimeMinutes} {t.blogMinRead}
                    </span>
                  )}
                  {post.viewCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {post.viewCount.toLocaleString()} {t.blogViews}
                    </span>
                  )}
                </div>
              </header>

              <div className="border-t border-neutral-800 pt-8">
                <BlogContent
                  html={contentHtml}
                  md={post.contentMd}
                />
              </div>

              {/* Imperative Code Copy button handler */}
              <CopyCodeButton />
            </article>

            {contentHtml && (
              <aside className="hidden lg:block lg:sticky lg:top-24">
                <TableOfContents
                  contentHtml={contentHtml}
                  className="mb-0"
                />
              </aside>
            )}
          </div>

          <section className="mt-14 pt-8 border-t border-neutral-800 max-w-4xl">
            <div className="flex items-center gap-2 mb-6 font-mono text-sm">
              <span className="text-emerald-400">$</span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                comments --stream
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500">
                giscus.active
              </span>
            </div>
            <GiscusComments slug={post.slug} />
          </section>

          <footer className="mt-12 pt-8 border-t border-neutral-800 space-y-6 max-w-4xl font-mono text-sm">
            <ShareButtons
              title={post.title}
              slug={post.slug}
              summary={post.summary}
            />

            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>$ cd /blog</span>
            </Link>
          </footer>
        </div>

        <BackToTop />
      </div>
    </StandardPageLayout>
  );
}

export default function BlogPostPage(props: BlogPostPageProps) {
  return (
    <Suspense fallback={<BlogPostSkeleton />}>
      <BlogPostContent {...props} />
    </Suspense>
  );
}
