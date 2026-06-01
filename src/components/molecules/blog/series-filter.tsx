"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BlogSeriesSummary } from "@/lib/services/series-service";

interface SeriesFilterProps {
  series: BlogSeriesSummary[];
  activeSeries?: string;
  search?: string;
}

function SeriesFilterInner({
  series,
  activeSeries,
  search,
}: SeriesFilterProps) {
  const searchParams = useSearchParams();

  const buildHref = (seriesSlug?: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (seriesSlug) {
      params.set("series", seriesSlug);
    } else {
      params.delete("series");
    }
    if (search) params.set("search", search);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  };

  if (series.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 font-mono">
      <span className="text-xs text-terminal-muted">Series:</span>
      <Link
        href={buildHref() as never}
        className={`rounded border px-2 py-0.5 text-xs transition-colors ${
          !activeSeries
            ? "border-terminal-accent/60 bg-terminal-accent/10 text-terminal-accent"
            : "border-terminal-border text-terminal-muted hover:border-terminal-muted"
        }`}
      >
        All
      </Link>
      {series.map((item) => (
        <Link
          key={item.id}
          href={buildHref(item.slug) as never}
          className={`rounded border px-2 py-0.5 text-xs transition-colors ${
            activeSeries === item.slug
              ? "border-terminal-accent/60 bg-terminal-accent/10 text-terminal-accent"
              : "border-terminal-border text-terminal-muted hover:border-terminal-muted"
          }`}
        >
          {item.title}
          {item.postCount > 0 && (
            <span className="ml-1 opacity-60">({item.postCount})</span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function SeriesFilter(props: SeriesFilterProps) {
  return (
    <Suspense fallback={null}>
      <SeriesFilterInner {...props} />
    </Suspense>
  );
}
