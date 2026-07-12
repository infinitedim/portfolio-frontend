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
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <FadeIn
          direction="up"
          duration={0.5}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <h2 className="font-mono text-2xl font-bold text-green-400">
            {t("landingBlogTitle")}
          </h2>
          <Link
            href="/blog"
            prefetch={false}
            className="font-mono text-xs text-neutral-500 transition-colors hover:text-green-400"
          >
            {t("blogAllPosts")} →
          </Link>
        </FadeIn>

        {posts.length === 0 ? (
          <p className="font-mono text-sm text-terminal-muted">
            {t("blogNoPosts")}{" "}
            <Link
              href="/blog"
              prefetch={false}
              className="text-green-400 hover:underline"
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
                        className="group block rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 transition-colors hover:border-green-400/30"
                      >
                        <h3 className="font-mono text-base font-semibold text-white group-hover:text-green-400">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="mt-2 line-clamp-2 font-mono text-xs text-neutral-400">
                            {post.summary}
                          </p>
                        )}
                        <p className="mt-2 font-mono text-xs text-terminal-muted/80">
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
