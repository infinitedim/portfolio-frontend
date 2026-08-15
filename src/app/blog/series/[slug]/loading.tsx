import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export default function BlogSeriesLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="min-h-screen bg-terminal-bg text-terminal-text"
        aria-busy="true"
        aria-label="Loading blog series..."
      >
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
          {/* Back button phantom */}
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-800/70" />

          {/* Series Header Phantom */}
          <header className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-800/60" />
              <span>•</span>
              <div className="h-4 w-16 animate-pulse rounded bg-neutral-800/60" />
            </div>

            <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-800/80" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-800/50" />
          </header>

          {/* Posts in Series List Phantom */}
          <div className="space-y-4">
            <div className="h-6 w-36 animate-pulse rounded bg-neutral-800/70" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4"
                >
                  <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-800/70 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-800/60" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
