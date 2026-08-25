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

/**
 * Static metadata configuration for the Roadmap hub page.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Roadmap | Engineering Skill Telemetry",
  description:
    "My learning progress across various technology roadmaps tracked on roadmap.sh",
};

/**
 * Asynchronous server component that retrieves roadmap dashboard metrics, streak data, and GitHub avatar.
 *
 * @description Concurrently queries the backend for user progress telemetry on roadmap.sh,
 * retrieves streak statistics, and resolves the GitHub avatar before rendering the dashboard organism.
 * If telemetry data fails to load, returns an empty state with error details.
 *
 * @async
 * @returns {Promise<JSX.Element>} The rendered roadmap dashboard organism or empty state component.
 */
async function RoadmapContent(): Promise<JSX.Element> {
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

/**
 * Roadmap overview page component displaying engineering skill progress telemetry.
 *
 * @description Houses the standard page layout, header section, and a suspense boundary
 * with skeleton fallback wrapping the asynchronous roadmap content.
 *
 * @returns {JSX.Element} The rendered Roadmap page.
 */
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
