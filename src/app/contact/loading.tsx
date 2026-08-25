import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export default function ContactLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="mx-auto max-w-2xl px-4 py-8 space-y-8"
        aria-busy="true"
        aria-label="Loading contact form..."
      >
                              
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-(--terminal-border)/50" />
        </div>

                                    
        <div className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50 p-6 space-y-6">
                            
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-(--terminal-border)/60" />
            <div className="h-10 w-full animate-pulse rounded border border-(--terminal-border) bg-(--terminal-bg)/90" />
          </div>

                             
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-(--terminal-border)/60" />
            <div className="h-10 w-full animate-pulse rounded border border-(--terminal-border) bg-(--terminal-bg)/90" />
          </div>

                                  
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-(--terminal-border)/60" />
            <div className="h-32 w-full animate-pulse rounded border border-(--terminal-border) bg-(--terminal-bg)/90" />
          </div>

                                       
          <div className="h-10 w-full animate-pulse rounded bg-(--terminal-accent)/20 border border-(--terminal-accent)/30" />
        </div>
      </div>
    </StandardPageLayout>
  );
}
