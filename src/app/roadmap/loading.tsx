import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PageHeader } from "@/components/atoms/shared/page-header";
import { RoadmapSkeleton } from "@/components/organisms/roadmap/roadmap-skeleton";

/**
 * Loading fallback component for the Roadmap overview page.
 *
 * @description Displays a standard page layout containing a page header and skeleton loader
 * while roadmap telemetry data and streak stats are being fetched asynchronously.
 *
 * @returns {JSX.Element} The rendered roadmap loading skeleton screen.
 */
export default function RoadmapLoading(): JSX.Element {
  return (
    <StandardPageLayout>
      <div
        className="min-h-screen px-4 py-10"
        aria-busy="true"
        aria-label="Loading roadmap telemetry..."
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <PageHeader
            title="roadmap"
            description="Learning progress and continuous skill telemetry tracked via roadmap.sh"
          />
          <RoadmapSkeleton />
        </div>
      </div>
    </StandardPageLayout>
  );
}
