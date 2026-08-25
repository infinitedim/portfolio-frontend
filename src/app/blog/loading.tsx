import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

function BlogCardPhantom({ index }: { index: number }): JSX.Element {
                                
  const titleWidths = ["w-4/5", "w-3/5", "w-3/4", "w-2/3", "w-5/6", "w-4/6"];
  const summaryWidths = [
    "w-full",
    "w-5/6",
    "w-4/5",
    "w-full",
    "w-3/4",
    "w-5/6",
  ];

  return (
    <article
      className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 border-l-2 border-l-neutral-800/60"
      aria-hidden="true"
    >
                   
      <div
        className={`h-6 ${titleWidths[index % titleWidths.length]} animate-pulse rounded bg-neutral-800/70 mb-2`}
      />

                     
      <div className="space-y-1.5 mb-3">
        <div
          className={`h-4 ${summaryWidths[index % summaryWidths.length]} animate-pulse rounded bg-neutral-800/50`}
        />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800/50" />
      </div>

                       
      <div className="flex flex-wrap gap-1 mb-3">
        <div className="h-5 w-16 animate-pulse rounded bg-neutral-800/60" />
        <div className="h-5 w-20 animate-pulse rounded bg-neutral-800/60" />
        <div className="h-5 w-14 animate-pulse rounded bg-neutral-800/60" />
      </div>

                                                     
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="h-3 w-28 animate-pulse rounded bg-neutral-800/50" />
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-800/50" />
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-neutral-800/50" />
      </div>
    </article>
  );
}

export default function BlogLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="mx-auto max-w-6xl px-4 py-8"
        aria-busy="true"
        aria-label="Loading blog posts"
      >
                                  
        <div className="mb-8 space-y-2">
          <div className="h-8 w-24 animate-pulse rounded bg-neutral-800/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-neutral-800/50" />
        </div>

                                  
        <div className="flex gap-2 mb-4">
          <div className="flex-1 h-10 animate-pulse rounded border border-neutral-800 bg-neutral-900" />
          <div className="h-10 w-20 animate-pulse rounded bg-emerald-400/10 border border-emerald-400/20" />
        </div>

                                      
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-7 animate-pulse rounded-full bg-neutral-800/60"
              style={{ width: `${48 + i * 12}px` }}
            />
          ))}
        </div>

                                                 
        <div className="space-y-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <BlogCardPhantom key={i} index={i} />
          ))}
        </div>
      </div>
    </StandardPageLayout>
  );
}
