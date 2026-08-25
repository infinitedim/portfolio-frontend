"use client";

import type { JSX } from "react";
import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

/**
 * Supported discussion category identifiers for GitHub Giscus integration.
 *
 * @typedef {"announcements" | "general" | "ideas" | "polls" | "qa" | "show-and-tell" | "blog-comments"} GiscusCategoryKey
 */
export type GiscusCategoryKey =
  | "announcements"
  | "general"
  | "ideas"
  | "polls"
  | "qa"
  | "show-and-tell"
  | "blog-comments";

/**
 * Mapping of discussion category keys to their respective environment variable names.
 *
 * @constant CATEGORY_ENV_MAP
 */
const CATEGORY_ENV_MAP: Record<
  GiscusCategoryKey,
  [categoryEnvName: string, categoryIdEnvName: string]
> = {
  announcements: [
    "NEXT_PUBLIC_GISCUS_CATEGORY_ANNOUNCEMENTS",
    "NEXT_PUBLIC_GISCUS_CATEGORY_ID_ANNOUNCEMENTS",
  ],
  general: [
    "NEXT_PUBLIC_GISCUS_CATEGORY_GENERAL",
    "NEXT_PUBLIC_GISCUS_CATEGORY_ID_GENERAL",
  ],
  ideas: [
    "NEXT_PUBLIC_GISCUS_CATEGORY_IDEAS",
    "NEXT_PUBLIC_GISCUS_CATEGORY_ID_IDEAS",
  ],
  polls: [
    "NEXT_PUBLIC_GISCUS_CATEGORY_POLLS",
    "NEXT_PUBLIC_GISCUS_CATEGORY_ID_POLLS",
  ],
  qa: ["NEXT_PUBLIC_GISCUS_CATEGORY_QA", "NEXT_PUBLIC_GISCUS_CATEGORY_ID_QA"],
  "show-and-tell": [
    "NEXT_PUBLIC_GISCUS_CATEGORY_SHOW_AND_TELL",
    "NEXT_PUBLIC_GISCUS_CATEGORY_ID_SHOW_AND_TELL",
  ],
  "blog-comments": [
    "NEXT_PUBLIC_GISCUS_CATEGORY_BLOG_COMMENTS",
    "NEXT_PUBLIC_GISCUS_CATEGORY_ID_BLOG_COMMENTS",
  ],
};

/**
 * Properties for the GiscusComments component.
 *
 * @interface GiscusCommentsProps
 * @property {string} slug - Unique article identifier or pathname term used for mapping discussion threads.
 * @property {GiscusCategoryKey} [categoryKey] - Preset discussion category key name.
 * @property {string} [category] - Direct override name for the target GitHub discussion category.
 * @property {string} [categoryId] - Direct override ID for the target GitHub discussion category.
 * @property {string} [theme] - Custom Giscus theme identifier or style URL.
 */
interface GiscusCommentsProps {
  slug: string;
  categoryKey?: GiscusCategoryKey;
  category?: string;
  categoryId?: string;
  theme?: string;
}

/**
 * Loading skeleton component rendered while Giscus discussion iframe is initializing.
 *
 * @returns {JSX.Element} The animated comments skeleton placeholder element.
 */
export function CommentsSkeleton(): JSX.Element {
  return (
    <div
      className="space-y-4 animate-pulse"
      aria-label="Loading comments..."
    >
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-neutral-800 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800" />
            <div className="h-3 w-32 rounded bg-neutral-800" />
            <div className="h-3 w-16 rounded bg-neutral-800 ml-auto" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-neutral-800" />
            <div className="h-3 w-4/5 rounded bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * GitHub Discussions comment feed integration component powered by Giscus.
 *
 * Resolves repository ID, discussion category configuration from environment variables or explicit props,
 * binds comments to the specific article slug, and reacts to active system theme changes.
 *
 * @param {GiscusCommentsProps} props - Component properties.
 * @param {string} props.slug - Article term identifier for mapping comments.
 * @param {GiscusCategoryKey} [props.categoryKey] - Category mapping identifier.
 * @param {string} [props.category] - Explicit discussion category name.
 * @param {string} [props.categoryId] - Explicit discussion category ID.
 * @param {string} [props.theme] - Custom theme identifier.
 * @returns {JSX.Element | null} The rendered Giscus iframe element or null when configuration is incomplete.
 */
export function GiscusComments({
  slug,
  categoryKey = "blog-comments",
  category: categoryProp,
  categoryId: categoryIdProp,
  theme: themeProp,
}: GiscusCommentsProps): JSX.Element | null {
  const { resolvedTheme } = useTheme();

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;

  const [categoryEnvKey, categoryIdEnvKey] = CATEGORY_ENV_MAP[categoryKey];
  const resolvedCategory =
    categoryProp ??
    process.env[categoryEnvKey] ??
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const resolvedCategoryId =
    categoryIdProp ??
    process.env[categoryIdEnvKey] ??
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  const activeTheme =
    themeProp ??
    process.env.NEXT_PUBLIC_GISCUS_THEME ??
    (resolvedTheme === "light" ? "light" : "transparent_dark");

  if (!repo || !repoId || !resolvedCategory || !resolvedCategoryId) {
    return null;
  }

  return (
    <Giscus
      repo={repo as `${string}/${string}`}
      repoId={repoId}
      category={resolvedCategory}
      categoryId={resolvedCategoryId}
      mapping="specific"
      term={slug}
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme={activeTheme}
      lang="en"
      loading="lazy"
    />
  );
}
