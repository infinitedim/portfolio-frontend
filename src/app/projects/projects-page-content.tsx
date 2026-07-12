import { JSX } from "react";
import { getProjectsData, getFeaturedProjects } from "@/lib/data/data-fetching";
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
