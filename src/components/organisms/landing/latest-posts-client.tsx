"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import {
  FadeIn,
  StaggerContainer,
  HoverCard,
} from "@/components/atoms/shared/motion-wrappers";

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  readingTimeMinutes: number;
  createdAt: string;
}

interface LatestPostsClientProps {
  posts: BlogPostItem[];
}

export function LatestPostsClient({
  posts,
}: LatestPostsClientProps): JSX.Element {
  const { t, currentLocale } = useI18n();

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
            className="font-mono text-xs text-(--terminal-muted) transition-colors duration-200 hover:text-(--terminal-accent)"
          >
            {t("blogAllPosts")} →
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
                          {post.readingTimeMinutes} {t("blogMinRead")} ·{" "}
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
