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
import { getCachedBlogPost } from "@/lib/services/cached-blog-fetch";
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
  searchParams,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale: localeParam } = await searchParams;
  const locale = localeParam?.trim() || DEFAULT_BLOG_LOCALE;
  const post = await getBlogPost(slug, locale);

  if (!post) {
    return {
      title: "Post Not Found | Blog",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: `${post.title} | Blog`,
    description: post.summary ?? post.title,
    authors: [{ name: "Dimas Saputra" }],
    alternates: {
      canonical: `/blog/${post.slug}`,
      languages: {
        en: `/blog/${post.slug}?locale=en`,
        id: `/blog/${post.slug}?locale=id`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.summary ?? post.title,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
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

  return (
    <StandardPageLayout>
      <ArticleSchema
        headline={post.title}
        description={post.summary || post.title}
        author="Dimas Saputra"
        publisher="infinitedim"
        datePublished={post.createdAt}
        dateModified={post.updatedAt}
        url={`https://infinitedim.dev/blog/${post.slug}`}
        keywords={post.tags?.join(", ")}
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
          <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between font-mono">
            <Link
              href="/blog"
              className="text-terminal-accent hover:text-terminal-accent/90 transition-colors"
            >
              {t.blogBackToBlog}
            </Link>
            <BlogLocaleSwitcher slug={slug} />
          </nav>

          {contentHtml && (
            <div className="lg:hidden mb-8">
              <TableOfContents contentHtml={contentHtml} />
            </div>
          )}

          <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-8 lg:items-start">
            <article className="prose prose-invert max-w-none min-w-0">
              <header className="mb-8 not-prose">
                <h1 className="text-4xl font-bold text-terminal-accent mb-4">
                  {post.title}
                </h1>
                {post.summary && (
                  <p className="text-xl text-terminal-muted mb-4">
                    {post.summary}
                  </p>
                )}
                {(post.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
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
                <div className="flex flex-wrap items-center gap-4 text-sm text-terminal-muted font-mono">
                  <time dateTime={post.createdAt}>
                    {t.blogPublishedPrefix}
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {post.updatedAt !== post.createdAt && (
                    <time dateTime={post.updatedAt}>
                      {t.blogUpdatedPrefix}
                      {new Date(post.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  )}
                  {post.readingTimeMinutes > 0 && (
                    <span>
                      {post.readingTimeMinutes} {t.blogMinRead}
                    </span>
                  )}
                  {post.viewCount > 0 && (
                    <span>
                      {post.viewCount.toLocaleString()} {t.blogViews}
                    </span>
                  )}
                </div>
              </header>

              <div className="border-t border-terminal-border pt-8">
                <BlogContent
                  html={contentHtml}
                  md={post.contentMd}
                />
              </div>

              {}
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

          <section className="mt-12 pt-8 border-t border-terminal-border max-w-4xl">
            <h2 className="text-xl font-semibold text-terminal-text mb-6">
              {t.blogComments}
            </h2>
            <GiscusComments slug={post.slug} />
          </section>

          <footer className="mt-12 pt-8 border-t border-terminal-border space-y-6 max-w-4xl font-mono">
            <ShareButtons
              title={post.title}
              slug={post.slug}
              summary={post.summary}
            />

            <Link
              href="/blog"
              className="block text-terminal-accent hover:text-terminal-accent/90 transition-colors"
            >
              {t.blogBackToBlog}
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
