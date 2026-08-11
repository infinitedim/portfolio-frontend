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
    <section className="border-t border-neutral-800 px-4 py-16 cv-auto-section">
      <div className="mx-auto max-w-6xl">
        <FadeIn
          direction="up"
          duration={0.5}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <h2 className="font-mono text-xl font-bold text-white">
            <span className="text-emerald-400">$</span> cat --latest-posts
          </h2>
          <Link
            href="/blog"
            prefetch={false}
            className="font-mono text-xs text-neutral-400 transition-colors duration-200 hover:text-emerald-400"
          >
            {t("blogAllPosts")} →
          </Link>
        </FadeIn>

        {posts.length === 0 ? (
          <p className="font-mono text-sm text-neutral-400">
            {t("blogNoPosts")}{" "}
            <Link
              href="/blog"
              prefetch={false}
              className="text-emerald-400 hover:underline"
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
                        className="group block rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 transition-colors duration-200 hover:border-emerald-400/40 border-l-2 border-l-emerald-400/30"
                      >
                        <h3 className="font-mono text-base font-bold text-white transition-colors duration-200 group-hover:text-emerald-400">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="mt-2 line-clamp-2 font-mono text-xs text-neutral-400">
                            {post.summary}
                          </p>
                        )}
                        <p className="mt-2 font-mono text-xs text-neutral-500">
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
