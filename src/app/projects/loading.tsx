import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { ProjectsLoading } from "@/components/organisms/projects/projects-loading";

/**
 * Loading skeleton component for the projects gallery root route (`/projects`).
 *
 * @description Renders a header title placeholder, category filter tabs skeleton,
 * and project cards skeleton grid inside the standard layout wrapper while data is streamed.
 *
 * @returns {JSX.Element} The rendered projects page loading skeleton.
 */
export default function ProjectsPageLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="mx-auto max-w-6xl px-4 py-8"
        aria-busy="true"
        aria-label="Loading projects..."
      >
                                   
        <div className="mb-8 space-y-2">
          <div className="h-8 w-36 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="h-4 w-72 animate-pulse rounded bg-(--terminal-border)/50" />
        </div>

                                           
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 h-10 animate-pulse rounded border border-(--terminal-border) bg-(--terminal-bg)/90" />
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded bg-(--terminal-border)/60" />
            <div className="h-10 w-24 animate-pulse rounded bg-(--terminal-border)/60" />
          </div>
        </div>

                                              
        <ProjectsLoading />
      </div>
    </StandardPageLayout>
  );
}
