import { Metadata } from "next";
import { Suspense, JSX } from "react";
import { ProjectsLoading } from "@/components/organisms/projects/projects-loading";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

/**
 * Static metadata configuration for the projects index page (`/projects`).
 *
 * @description Defines page title, description, keywords, OpenGraph previews,
 * Twitter summary cards, and canonical alternate URLs for the projects portfolio index.
 */
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
    languages: {
      en: "/projects",
      id: "/projects?locale=id",
      "x-default": "/projects",
    },
  },
};

import { ProjectsPageContent } from "./projects-page-content";

/**
 * Server Component entry point for the projects gallery root route (`/projects`).
 *
 * @description Wraps the asynchronous projects content in a Suspense boundary with skeleton
 * fallback within the standard page layout.
 *
 * @returns {JSX.Element} The rendered projects page tree.
 */
export default function ProjectsPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsPageContent />
      </Suspense>
    </StandardPageLayout>
  );
}
