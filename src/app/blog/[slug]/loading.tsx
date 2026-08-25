import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export default function BlogPostLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="min-h-screen bg-(--terminal-bg) text-(--terminal-text)"
        aria-busy="true"
        aria-label="Loading blog article"
      >
        <div className="mx-auto max-w-6xl px-4 py-8">
                                               
          <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between font-mono">
            <div className="h-4 w-24 animate-pulse rounded bg-(--terminal-border)/70" />
            <div className="h-8 w-32 animate-pulse rounded bg-(--terminal-border)/50" />
          </nav>

                                     
          <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-8 lg:items-start">
            <article className="max-w-none min-w-0">
                                    
              <header className="mb-8 space-y-4">
                             
                <div className="space-y-2">
                  <div className="h-9 w-3/4 animate-pulse rounded bg-(--terminal-border)/70" />
                  <div className="h-9 w-1/2 animate-pulse rounded bg-(--terminal-border)/70" />
                </div>

                               
                <div className="h-5 w-5/6 animate-pulse rounded bg-(--terminal-border)/50" />

                            
                <div className="flex flex-wrap gap-1">
                  <div className="h-5 w-16 animate-pulse rounded bg-(--terminal-border)/60" />
                  <div className="h-5 w-20 animate-pulse rounded bg-(--terminal-border)/60" />
                  <div className="h-5 w-14 animate-pulse rounded bg-(--terminal-border)/60" />
                </div>

                                                       
                <div className="flex flex-wrap items-center gap-4 font-mono text-sm">
                  <div className="h-4 w-36 animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-20 animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-24 animate-pulse rounded bg-(--terminal-border)/50" />
                </div>
              </header>

                                                  
              <div className="border-t border-(--terminal-border) pt-8 space-y-5">
                                   
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-(--terminal-border)/50" />
                </div>

                               
                <div className="h-6 w-2/5 animate-pulse rounded bg-(--terminal-border)/60 mt-2" />

                                   
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-(--terminal-border)/50" />
                </div>

                                          
                <div className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/90 p-4 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-(--terminal-border)/40" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-(--terminal-accent)/20" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-(--terminal-border)/40" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-(--terminal-accent)/20" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-(--terminal-border)/40" />
                </div>

                                   
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-(--terminal-border)/50" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-(--terminal-border)/50" />
                </div>
              </div>
            </article>

                                                                    
            <aside className="hidden lg:block lg:sticky lg:top-24 space-y-3">
              <div className="h-4 w-32 animate-pulse rounded bg-(--terminal-border)/60" />
              <div className="space-y-2 pl-2 border-l border-(--terminal-border)">
                <div className="h-3 w-36 animate-pulse rounded bg-(--terminal-border)/50" />
                <div className="h-3 w-28 animate-pulse rounded bg-(--terminal-border)/50" />
                <div className="h-3 w-32 animate-pulse rounded bg-(--terminal-border)/50" />
                <div className="h-3 w-24 animate-pulse rounded bg-(--terminal-border)/50" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
