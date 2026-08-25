/**
 * @fileoverview Empty/error state organism component for the roadmap dashboard,
 * rendered when upstream roadmap data fails to fetch or credentials are unconfigured.
 * @module components/organisms/roadmap/roadmap-empty-state
 */

"use client";

import type { RoadmapFetchError } from "@/lib/data/data-fetching";
import { useI18n } from "@/hooks/use-i18n";

/**
 * Props for the RoadmapEmptyState component.
 *
 * @interface RoadmapEmptyStateProps
 * @property {RoadmapFetchError | null} [error] - Optional fetch error object with status code and failure message.
 */
interface RoadmapEmptyStateProps {
  error?: RoadmapFetchError | null;
}

/**
 * Renders a terminal-styled error or empty state card for roadmap tracking.
 *
 * @description
 * Inspects the provided error to determine whether missing API credentials (401 / credential issue)
 * or upstream connectivity failures occurred, displaying localized error badges, messages,
 * and diagnostic HTTP status information formatted as a CLI diagnostic prompt.
 *
 * @param {RoadmapEmptyStateProps} props - The component props.
 * @param {RoadmapFetchError | null} [props.error] - Optional error details from upstream roadmap API fetch.
 * @returns {React.JSX.Element} The rendered error/empty state UI.
 */
export function RoadmapEmptyState({ error }: RoadmapEmptyStateProps) {
  const { t } = useI18n();

  const isCredentialMissing =
    error?.status === 401 ||
    error?.message?.toLowerCase().includes("credential");

  return (
    <div className="mx-auto max-w-xl py-12 font-mono text-center">
      <div className="rounded-2xl border border-red-500/30 bg-neutral-900/80 p-8 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col items-center gap-4">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-red-500/0 via-red-500 to-red-500/0" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>
            {isCredentialMissing
              ? t("roadmapErrUnconfigured")
              : t("roadmapErrUnreachable")}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">
          <span className="text-red-400">$</span> roadmap --connect --fail
        </h2>

        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
          {isCredentialMissing
            ? t("roadmapErrCredsDesc")
            : error?.message || t("roadmapErrUpstreamDesc")}
        </p>

        <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-[11px] text-neutral-500 font-mono">
          <span>
            {t("roadmapErrErrorCode")} {error?.status || 503}
          </span>
          <span className="mx-2">|</span>
          <span>{t("roadmapErrTarget")} /api/roadmap/dashboard</span>
        </div>
      </div>
    </div>
  );
}
