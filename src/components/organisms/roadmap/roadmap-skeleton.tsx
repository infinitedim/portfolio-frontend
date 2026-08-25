/**
 * @fileoverview Skeleton placeholder organism component for roadmap dashboards during asynchronous data fetching.
 * @module components/organisms/roadmap/roadmap-skeleton
 */

"use client";

import type { JSX } from "react";

/**
 * Skeleton loading state component for the roadmap dashboard.
 *
 * @description
 * Displays animated pulse placeholders mirroring the layout of the user profile banner,
 * streak statistics, overall progress bar, and roadmap topic grid cards while data is being loaded.
 *
 * @returns {JSX.Element} The rendered skeleton placeholder elements.
 */
export function RoadmapSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-8 font-mono animate-pulse">
                                     
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-neutral-800" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-neutral-800" />
            <div className="h-3 w-56 rounded bg-neutral-800/60" />
          </div>
        </div>
        <div className="h-7 w-36 rounded-full bg-neutral-800" />
      </div>

                             
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
        <div className="h-4 w-48 rounded bg-neutral-800" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-20 rounded-lg bg-neutral-800/60" />
          <div className="h-20 rounded-lg bg-neutral-800/60" />
          <div className="h-20 rounded-lg bg-neutral-800/60" />
          <div className="h-20 rounded-lg bg-neutral-800/60" />
        </div>
      </div>

                                   
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-3">
        <div className="h-4 w-60 rounded bg-neutral-800" />
        <div className="h-3 w-full rounded-full bg-neutral-800/70" />
      </div>

                           
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="h-48 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4" />
        <div className="h-48 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4" />
        <div className="h-48 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4" />
        <div className="h-48 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4" />
      </div>
    </div>
  );
}
