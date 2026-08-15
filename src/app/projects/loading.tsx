import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { ProjectsLoading } from "@/components/organisms/projects/projects-loading";

export default function ProjectsPageLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="mx-auto max-w-6xl px-4 py-8"
        aria-busy="true"
        aria-label="Loading projects..."
      >
        {/* Page Header Phantom */}
        <div className="mb-8 space-y-2">
          <div className="h-8 w-36 animate-pulse rounded bg-neutral-800/70" />
          <div className="h-4 w-72 animate-pulse rounded bg-neutral-800/50" />
        </div>

        {/* Filter & Search Bar Phantom */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 h-10 animate-pulse rounded border border-neutral-800 bg-neutral-900" />
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded bg-neutral-800/60" />
            <div className="h-10 w-24 animate-pulse rounded bg-neutral-800/60" />
          </div>
        </div>

        {/* Projects Grid Loading Skeleton */}
        <ProjectsLoading />
      </div>
    </StandardPageLayout>
  );
}
