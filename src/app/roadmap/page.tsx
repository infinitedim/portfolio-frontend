import type { Metadata } from "next";
import { Suspense, type JSX } from "react";
import { headers } from "next/headers";
import {
  getRoadmapDashboardWithError,
  getRoadmapStreak,
  getGitHubAvatar,
} from "@/lib/data/data-fetching";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PageHeader } from "@/components/atoms/shared/page-header";
import { RoadmapDashboardOrganism } from "@/components/organisms/roadmap/roadmap-dashboard";
import { RoadmapEmptyState } from "@/components/organisms/roadmap/roadmap-empty-state";
import { RoadmapSkeleton } from "@/components/organisms/roadmap/roadmap-skeleton";

export const metadata: Metadata = {
  title: "Roadmap | Engineering Skill Telemetry",
  description:
    "My learning progress across various technology roadmaps tracked on roadmap.sh",
};

async function RoadmapContent(): Promise<JSX.Element> {
  // Request-time data (roadmap.sh proxy); avoids build-time SSG timeout with cacheComponents.
  await headers();

  const [dashboardResult, streak, githubAvatar] = await Promise.all([
    getRoadmapDashboardWithError(),
    getRoadmapStreak(),
    getGitHubAvatar(),
  ]);

  const dashboard = dashboardResult.data;
  if (!dashboard) return <RoadmapEmptyState error={dashboardResult.error} />;

  const updatedDashboard = {
    ...dashboard,
    avatar: githubAvatar || dashboard.avatar || "https://github.com/infinitedim.png",
  };

  return <RoadmapDashboardOrganism dashboard={updatedDashboard} streak={streak} />;
}

export default function RoadmapPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageHeader
            title="roadmap"
            description="Learning progress and continuous skill telemetry tracked via roadmap.sh"
          />
          <Suspense fallback={<RoadmapSkeleton />}>
            <RoadmapContent />
          </Suspense>
        </div>
      </div>
    </StandardPageLayout>
  );
}
