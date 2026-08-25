import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export default function AboutLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="mx-auto max-w-4xl px-4 py-8 space-y-12"
        aria-busy="true"
        aria-label="Loading about page..."
      >
                              
        <div className="space-y-3">
          <div className="h-8 w-40 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="h-4 w-80 animate-pulse rounded bg-(--terminal-border)/50" />
        </div>

                                    
        <div className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="h-24 w-24 rounded-full animate-pulse bg-(--terminal-border)/70 shrink-0" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-48 animate-pulse rounded bg-(--terminal-border)/80" />
              <div className="h-4 w-36 animate-pulse rounded bg-(--terminal-border)/50" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full animate-pulse rounded bg-(--terminal-border)/40" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-(--terminal-border)/40" />
              </div>
            </div>
          </div>
        </div>

                                         
        <div className="space-y-6">
          <div className="h-6 w-44 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/30 p-4 space-y-3"
              >
                <div className="h-4 w-28 animate-pulse rounded bg-(--terminal-border)/60" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div
                      key={j}
                      className="h-6 w-16 animate-pulse rounded bg-(--terminal-border)/50"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

                                           
        <div className="space-y-6">
          <div className="h-6 w-48 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="space-y-4 border-l-2 border-(--terminal-border) pl-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 relative">
                <div className="h-5 w-48 animate-pulse rounded bg-(--terminal-border)/60" />
                <div className="h-3 w-32 animate-pulse rounded bg-(--terminal-border)/40" />
                <div className="h-3 w-full animate-pulse rounded bg-(--terminal-border)/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
