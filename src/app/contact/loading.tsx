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
        {/* Header Phantom */}
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded bg-neutral-800/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-neutral-800/50" />
        </div>

        {/* Contact Form Phantom */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 space-y-6">
          {/* Name input */}
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-800/60" />
            <div className="h-10 w-full animate-pulse rounded border border-neutral-800 bg-neutral-900" />
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-800/60" />
            <div className="h-10 w-full animate-pulse rounded border border-neutral-800 bg-neutral-900" />
          </div>

          {/* Message textarea */}
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-800/60" />
            <div className="h-32 w-full animate-pulse rounded border border-neutral-800 bg-neutral-900" />
          </div>

          {/* Submit Button Phantom */}
          <div className="h-10 w-full animate-pulse rounded bg-emerald-500/20 border border-emerald-500/30" />
        </div>
      </div>
    </StandardPageLayout>
  );
}
