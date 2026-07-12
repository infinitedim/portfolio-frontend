import { Metadata } from "next";
import { Suspense, JSX } from "react";
import { getProjectsData, getFeaturedProjects } from "@/lib/data/data-fetching";
import { ProjectsLoading } from "@/components/organisms/projects/projects-loading";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export const metadata: Metadata = {
  title: "Projects | Terminal Portfolio",
  description:
    "Explore web development projects built with React, Next.js, TypeScript, and modern technologies.",
  keywords: [
    "web development projects",
    "react projects",
    "nextjs portfolio",
    "full-stack applications",
    "javascript projects",
    "typescript projects",
  ],
  openGraph: {
    title: "Projects | Terminal Portfolio",
    description:
      "Innovative web development projects showcasing modern technologies",
    type: "website",
    images: [
      {
        url: "/og-projects.png",
        width: 1200,
        height: 630,
        alt: "Projects Portfolio Overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | Terminal Portfolio",
    description: "Innovative web development projects",
    images: ["/og-projects.png"],
  },
  alternates: {
    canonical: "/projects",
  },
};

import { ProjectsPageContent } from "./projects-page-content";

export default function ProjectsPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsPageContent />
      </Suspense>
    </StandardPageLayout>
  );
}
