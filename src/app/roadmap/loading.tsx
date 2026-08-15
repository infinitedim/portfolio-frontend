import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PageHeader } from "@/components/atoms/shared/page-header";
import { RoadmapSkeleton } from "@/components/organisms/roadmap/roadmap-skeleton";

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
