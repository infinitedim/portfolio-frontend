import Link from "next/link";
import { TagChip } from "@/components/atoms/shared/tag-chip";

export interface TagWithCount {
  name: string;
  slug: string;
  postCount: number;
}

interface TagFilterProps {
  tags: TagWithCount[];
  activeTag?: string;
  searchParam?: string;
}

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

export function TagFilter({ tags, activeTag, searchParam }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <span className="text-xs text-gray-500 shrink-0">Filter:</span>

      <Link href={buildTagUrl(undefined, searchParam) as never}>
        <TagChip
          name="All"
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
