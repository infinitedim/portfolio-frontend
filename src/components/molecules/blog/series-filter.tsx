"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BlogSeriesSummary } from "@/lib/services/series-service";
import { useI18n } from "@/hooks/use-i18n";

/**
 * Props for the blog series filter component.
 */
interface SeriesFilterProps {
  /** List of available blog series summaries. */
  series: BlogSeriesSummary[];
  /** The currently selected series slug, if any. */
  activeSeries?: string;
  /** The current search query string, preserved across series navigation. */
  search?: string;
}

/**
 * Inner component for series filtering with search param synchronization.
 *
 * @param props - Component properties.
 * @param props.series - Available blog series summaries.
 * @param props.activeSeries - Slug of the currently active series filter.
 * @param props.search - Active search term to retain when switching series.
 * @returns The rendered series filter bar or null if series list is empty.
 */
function SeriesFilterInner({
  series,
  activeSeries,
  search,
}: SeriesFilterProps) {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  /**
   * Constructs the URL href string with updated series filter parameters.
   *
   * @param seriesSlug - Optional slug of the series to filter by.
   * @returns Formatted query path for blog navigation.
   */
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
    <div className="mb-6 flex flex-col gap-2 font-mono">
      <div className="flex items-center gap-2 text-xs text-(--terminal-muted)">
        <span className="text-(--terminal-accent) font-bold">$</span>
        <span className="text-(--terminal-text) font-semibold">series</span>
        <span className="text-(--terminal-muted)">--filter=</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <Link
          href={buildHref() as never}
          className={`px-3 py-1.5 rounded-lg border font-mono transition-all duration-200 whitespace-nowrap cursor-pointer ${
            !activeSeries
              ? "border-(--terminal-accent)/50 bg-(--terminal-accent)/10 text-(--terminal-accent) font-semibold shadow-sm"
              : "border-(--terminal-border) bg-(--terminal-bg)/60 text-(--terminal-muted) hover:border-(--terminal-accent)/40 hover:text-(--terminal-text)"
          }`}
        >
          [ {t("logsAll")} ]
        </Link>
        {series.map((item, index) => {
          const isActive = activeSeries === item.slug;
          const orderNum = String(index + 1).padStart(2, "0");
          return (
            <Link
              key={item.id}
              href={buildHref(item.slug) as never}
              className={`px-3 py-1.5 rounded-lg border font-mono transition-all duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "border-(--terminal-accent)/50 bg-(--terminal-accent)/10 text-(--terminal-accent) font-semibold shadow-sm"
                  : "border-(--terminal-border) bg-(--terminal-bg)/60 text-(--terminal-muted) hover:border-(--terminal-accent)/40 hover:text-(--terminal-text)"
              }`}
            >
              <span className="text-(--terminal-accent)/70 font-semibold">{orderNum} ::</span>
              <span>{item.title}</span>
              {item.postCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isActive
                      ? "bg-(--terminal-accent)/20 text-(--terminal-accent)"
                      : "bg-(--terminal-border) text-(--terminal-muted)"
                  }`}
                >
                  {item.postCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SeriesFilter component wrapped in Suspense for safe search params consumption.
 *
 * @param props - Component properties for filtering blog series.
 * @returns The Suspense-wrapped series filter component.
 */
export function SeriesFilter(props: SeriesFilterProps) {
  return (
    <Suspense fallback={null}>
      <SeriesFilterInner {...props} />
    </Suspense>
  );
}

