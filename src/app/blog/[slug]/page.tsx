import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScrollProgress } from "@/components/molecules/blog/scroll-progress";
import { BackToTop } from "@/components/molecules/blog/back-to-top";
import { CopyCodeButton } from "@/components/molecules/blog/copy-code-button";
import { ShareButtons } from "@/components/molecules/blog/share-buttons";
import { TableOfContents } from "@/components/molecules/blog/table-of-contents";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { GiscusComments } from "@/components/molecules/blog/giscus-comments-dynamic";

import { getServerApiUrl } from "@/lib/api/get-api-url";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { addHeadingIdsToHtml } from "@/lib/blog/html-headings";
import { BlogLocaleSwitcher } from "@/components/molecules/blog/locale-switcher";
import { DEFAULT_BLOG_LOCALE } from "@/lib/i18n/locales";

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
  try {
    const backendUrl = getBackendUrl();
    const params = new URLSearchParams({ locale });
    const response = await fetch(
      `${backendUrl}/api/blog/${slug}?${params.toString()}`,
      {
        next: { revalidate: 3600 },
      },
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
  }

  return null;
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
      return (data.items || []).map((post: { slug: string }) => ({
        slug: post.slug,
      }));
    }
  } catch (error) {
    console.error("Failed to generate static params:", error);
  }

  return [];
}

export default async function BlogPostPage({
  params,
  searchParams,
}: BlogPostPageProps) {
  const { slug } = await params;
  const { locale: localeParam } = await searchParams;
  const locale = localeParam?.trim() || DEFAULT_BLOG_LOCALE;
  const post = await getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  if (!post.published) {
    notFound();
  }

  const contentHtml = post.contentHtml
    ? addHeadingIdsToHtml(post.contentHtml)
    : null;

  return (
    <StandardPageLayout>
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <ScrollProgress />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/blog"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            ← Back to Blog
          </Link>
          <BlogLocaleSwitcher slug={slug} />
        </nav>

        {contentHtml && (
          <div className="lg:hidden mb-8">
            <TableOfContents contentHtml={contentHtml} />
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-8 lg:items-start">
          <article className="prose prose-invert prose-green max-w-none min-w-0">
          <header className="mb-8 not-prose">
            <h1 className="text-4xl font-bold text-green-400 mb-4">
              {post.title}
            </h1>
            {post.summary && (
              <p className="text-xl text-gray-400 mb-4">{post.summary}</p>
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
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <time dateTime={post.createdAt}>
                Published:{" "}
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.updatedAt !== post.createdAt && (
                <time dateTime={post.updatedAt}>
                  Updated:{" "}
                  {new Date(post.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
              {post.readingTimeMinutes > 0 && (
                <span>{post.readingTimeMinutes} min read</span>
              )}
              {post.viewCount > 0 && (
                <span>{post.viewCount.toLocaleString()} views</span>
              )}
            </div>
          </header>

          <div className="border-t border-gray-800 pt-8">
            {contentHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: contentHtml }}
                className="prose prose-invert prose-green max-w-none
                  prose-headings:text-green-400
                  prose-a:text-green-400
                  prose-strong:text-gray-100
                  prose-code:text-green-300
                  prose-code:bg-gray-800
                  prose-code:px-1
                  prose-code:rounded
                  prose-pre:bg-gray-900
                  prose-pre:border
                  prose-pre:border-gray-800
                  prose-pre:relative"
              />
            ) : post.contentMd ? (
              <div className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                {post.contentMd}
              </div>
            ) : (
              <p className="text-gray-500">No content available.</p>
            )}
          </div>

          { }
          <CopyCodeButton />
        </article>

        {contentHtml && (
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <TableOfContents contentHtml={contentHtml} className="mb-0" />
          </aside>
        )}
        </div>

        <section className="mt-12 pt-8 border-t border-gray-800 max-w-4xl">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">Comments</h2>
          <GiscusComments slug={post.slug} />
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-800 space-y-6 max-w-4xl">
          <ShareButtons
            title={post.title}
            slug={post.slug}
            summary={post.summary}
          />

          <Link
            href="/blog"
            className="block text-green-400 hover:text-green-300 transition-colors"
          >
            ← Back to Blog
          </Link>
        </footer>
      </div>

      <BackToTop />
    </div>
    </StandardPageLayout>
  );
}

export const revalidate = 3600;
