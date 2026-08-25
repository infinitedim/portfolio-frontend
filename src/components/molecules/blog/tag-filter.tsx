"use client";

import Link from "next/link";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { useI18n } from "@/hooks/use-i18n";

/**
 * Represents a blog tag along with its associated post count.
 */
export interface TagWithCount {
  /** The display name of the tag. */
  name: string;
  /** The URL-friendly slug of the tag. */
  slug: string;
  /** Number of published posts tagged with this tag. */
  postCount: number;
}

/**
 * Props for the TagFilter component.
 */
interface TagFilterProps {
  /** Array of available tags with their post counts. */
  tags: TagWithCount[];
  /** Name of the currently active tag filter, if any. */
  activeTag?: string;
  /** Active search query parameter to preserve in the URL. */
  searchParam?: string;
}

/**
 * Builds a blog URL with updated tag and search query parameters.
 *
 * @param tag - Tag name to set, or undefined to clear.
 * @param search - Optional search query string.
 * @returns Formatted URL string for blog navigation.
 */
function buildTagUrl(
  tag: string | undefined,
  search: string | undefined,
): string {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (search) params.set("search", search);
  const qs = params.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

/**
 * TagFilter component that renders a horizontal scrolling list of tag chips
 * for filtering blog posts.
 *
 * @param props - Component properties.
 * @param props.tags - List of tags with counts.
 * @param props.activeTag - Currently selected tag name.
 * @param props.searchParam - Current search query parameter to preserve.
 * @returns The rendered tag filter list or null if no tags are provided.
 */
export function TagFilter({ tags, activeTag, searchParam }: TagFilterProps) {
  const { t } = useI18n();
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <span className="text-xs text-gray-500 shrink-0">{t("blogFilter")}</span>

      <Link href={buildTagUrl(undefined, searchParam) as never}>
        <TagChip
          name={t("logsAll")}
          active={!activeTag}
          size="sm"
        />
      </Link>

      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={
            buildTagUrl(
              tag.name === activeTag ? undefined : tag.name,
              searchParam,
            ) as never
          }
        >
          <TagChip
            name={tag.name}
            slug={tag.slug}
            count={tag.postCount}
            active={tag.name === activeTag}
            size="sm"
          />
        </Link>
      ))}
    </div>
  );
}
