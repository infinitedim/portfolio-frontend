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
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">Series:</span>
      <Link
        href={buildHref() as never}
        className={`rounded border px-2 py-0.5 text-xs transition-colors ${
          !activeSeries
            ? "border-green-400/60 bg-green-400/10 text-green-400"
            : "border-gray-700 text-gray-400 hover:border-gray-500"
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
              ? "border-green-400/60 bg-green-400/10 text-green-400"
              : "border-gray-700 text-gray-400 hover:border-gray-500"
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
