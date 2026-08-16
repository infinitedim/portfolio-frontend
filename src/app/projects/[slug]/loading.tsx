import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export default function ProjectDetailLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="mx-auto max-w-6xl px-4 py-8 space-y-8"
        aria-busy="true"
        aria-label="Loading project details..."
      >
        {/* Back Link Phantom */}
        <div className="h-4 w-32 animate-pulse rounded bg-(--terminal-border)/70" />

        {/* Hero Section Phantom */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-9 w-2/3 animate-pulse rounded bg-(--terminal-border)/80" />
            <div className="h-6 w-20 animate-pulse rounded bg-(--terminal-accent)/20" />
          </div>

          <div className="h-5 w-4/5 animate-pulse rounded bg-(--terminal-border)/50" />

          {/* Tech Badges Phantom */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-6 w-20 animate-pulse rounded bg-(--terminal-border)/60"
              />
            ))}
          </div>

          {/* CTA Buttons Phantom */}
          <div className="flex gap-4 pt-2">
            <div className="h-10 w-32 animate-pulse rounded bg-(--terminal-accent)/20" />
            <div className="h-10 w-32 animate-pulse rounded bg-(--terminal-border)/60" />
          </div>
        </div>

        {/* Mockup Frame Phantom */}
        <div className="h-80 w-full animate-pulse rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/60" />

        {/* Metrics Grid Phantom */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/40 p-4 space-y-2"
            >
              <div className="h-3 w-16 bg-(--terminal-border)/50 rounded" />
              <div className="h-6 w-24 bg-(--terminal-border)/80 rounded" />
            </div>
          ))}
        </div>

        {/* Engineering Highlights Phantom */}
        <div className="space-y-4 border-t border-(--terminal-border) pt-8">
          <div className="h-6 w-48 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/30 p-4 space-y-3"
              >
                <div className="h-4 w-3/4 bg-(--terminal-border)/60 rounded" />
                <div className="h-3 w-full bg-(--terminal-border)/40 rounded" />
                <div className="h-3 w-5/6 bg-(--terminal-border)/40 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
