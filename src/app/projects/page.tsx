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

import { ProjectsClient } from "./projects-client";

export async function ProjectsPageContent(): Promise<JSX.Element> {
  const [allProjects, featuredProjects] = await Promise.all([
    getProjectsData(),
    getFeaturedProjects(),
  ]);

  return (
    <>
      <ProjectsClient
        allProjects={allProjects}
        featuredProjects={featuredProjects}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Web Development Projects",
            description: "Portfolio of web development projects",
            numberOfItems: allProjects.length,
            itemListElement: allProjects.map((project, index) => ({
              "@type": "CreativeWork",
              position: index + 1,
              name: project.name,
              description: project.description,
              url: project.demoUrl || project.githubUrl,
              author: {
                "@type": "Person",
                name: "Developer Portfolio",
              },
              programmingLanguage: project.technologies,
              dateCreated: "2024-01-01",
              creativeWorkStatus: project.status,
            })),
          }),
        }}
      />
    </>
  );
}

export default function ProjectsPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsPageContent />
      </Suspense>
    </StandardPageLayout>
  );
}
