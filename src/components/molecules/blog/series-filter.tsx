"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BlogSeriesSummary } from "@/lib/services/series-service";
import { useI18n } from "@/hooks/use-i18n";

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
  const { t } = useI18n();
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
    <div className="mb-6 flex flex-col gap-2 font-mono">
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <span className="text-emerald-400 font-bold">$</span>
        <span className="text-neutral-300 font-semibold">series</span>
        <span className="text-neutral-500">--filter=</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <Link
          href={buildHref() as never}
          className={`px-3 py-1.5 rounded-lg border font-mono transition-all duration-200 whitespace-nowrap cursor-pointer ${
            !activeSeries
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold shadow-sm shadow-emerald-500/10"
              : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
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
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold shadow-sm shadow-emerald-500/10"
                  : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
              }`}
            >
              <span className="text-emerald-500/70 font-semibold">{orderNum} ::</span>
              <span>{item.title}</span>
              {item.postCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-neutral-800 text-neutral-400"
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

export function SeriesFilter(props: SeriesFilterProps) {
  return (
    <Suspense fallback={null}>
      <SeriesFilterInner {...props} />
    </Suspense>
  );
}
