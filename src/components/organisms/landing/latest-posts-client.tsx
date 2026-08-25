"use client";

import Link from "next/link";
import { type JSX } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import {
  FadeIn,
  StaggerContainer,
  HoverCard,
} from "@/components/atoms/shared/motion-wrappers";

/**
 * Represents a blog post item payload for the latest posts widget.
 */
interface BlogPostItem {
  /**
   * Unique identifier of the blog post.
   */
  id: string;
  /**
   * Article title.
   */
  title: string;
  /**
   * URL-friendly slug for routing to the individual post.
   */
  slug: string;
  /**
   * Brief summary or excerpt of the article content.
   */
  summary: string | null;
  /**
   * Estimated reading duration in minutes.
   */
  readingTimeMinutes: number;
  /**
   * ISO 8601 creation timestamp.
   */
  createdAt: string;
}

/**
 * Props for the {@link LatestPostsClient} component.
 */
interface LatestPostsClientProps {
  /**
   * Array of recent blog posts to display.
   */
  posts: BlogPostItem[];
}

/**
 * Client-side interactive list of the most recent blog posts for the landing page.
 *
 * @description
 * Renders an animated terminal-themed section (`$ cat --latest-posts`) listing up to 3 blog posts.
 * Includes interactive hover effects, reading time indicators, localized date formatting,
 * and an empty state linking directly to the blog archive.
 *
 * @param props - The component props.
 * @param props.posts - The list of blog post summaries.
 * @returns The rendered latest posts section JSX element.
 */
export function LatestPostsClient({
  posts,
}: LatestPostsClientProps): JSX.Element {
  const { t, currentLocale } = useI18n();

  /**
   * Formats an ISO date string according to the active locale.
   *
   * @param dateStr - The ISO 8601 date string to format.
   * @returns Formatted localized date string (e.g. "Aug 25, 2026"), falling back to "en-US" on error.
   */
  const formattedDate = (dateStr: string) => {
    try {
      const locale = currentLocale.replace("_", "-");
      return new Date(dateStr).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  return (
    <section className="border-t border-(--terminal-border) px-4 py-16 cv-auto-section transition-colors duration-300">
      <div className="mx-auto max-w-6xl font-mono">
        <FadeIn
          direction="up"
          duration={0.5}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <h2 className="font-mono text-xl font-bold text-(--terminal-text)">
            <span className="text-(--terminal-accent)">$</span> cat --latest-posts
          </h2>
          <Link
            href="/blog"
            prefetch={false}
            className="group inline-flex items-center gap-1 font-mono text-xs text-(--terminal-muted) transition-colors duration-200 hover:text-(--terminal-accent)"
          >
            {t("blogAllPosts")}
            <ArrowRight
              size={14}
              className="transition-transform duration-200 ease-out group-hover:translate-x-1"
            />
          </Link>
        </FadeIn>

        {posts.length === 0 ? (
          <p className="font-mono text-sm text-(--terminal-muted)">
            {t("blogNoPosts")}{" "}
            <Link
              href="/blog"
              prefetch={false}
              className="text-(--terminal-accent) hover:underline"
            >
              {t("blogVisit")}
            </Link>
          </p>
        ) : (
          <StaggerContainer>
            <ul className="space-y-4">
              {posts.map((post, index) => (
                <FadeIn
                  key={post.id}
                  direction="up"
                  delay={index * 0.08}
                  duration={0.5}
                >
                  <li className="list-none">
                    <HoverCard scale={1.015}>
                      <Link
                        href={`/blog/${post.slug}`}
                        prefetch={false}
                        className="group block rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/70 p-5 transition-colors duration-200 hover:border-(--terminal-accent)/60 border-l-2 border-l-(--terminal-accent)/50"
                      >
                        <h3 className="font-mono text-base font-bold text-(--terminal-text) transition-colors duration-200 group-hover:text-(--terminal-accent)">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="mt-2 line-clamp-2 font-mono text-xs text-(--terminal-muted)">
                            {post.summary}
                          </p>
                        )}
                        <p className="mt-2 font-mono text-xs text-(--terminal-muted)/70">
                          {post.readingTimeMinutes} {t("blogMinRead")}
                          <span className="mx-1 text-(--terminal-border)">|</span>
                          {formattedDate(post.createdAt)}
                        </p>
                      </Link>
                    </HoverCard>
                  </li>
                </FadeIn>
              ))}
            </ul>
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
