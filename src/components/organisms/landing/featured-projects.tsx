import Link from "next/link";
import { type JSX } from "react";
import { getFeaturedProjects } from "@/lib/data/data-fetching";
import { ProjectCard } from "@/components/molecules/projects/project-card";

export async function FeaturedProjects(): Promise<JSX.Element> {
  const projects = await getFeaturedProjects();

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-mono text-2xl font-bold text-green-400">
            Featured Projects
          </h2>
          <Link
            href="/projects"
            className="font-mono text-xs text-neutral-500 transition-colors hover:text-green-400"
          >
            View all →
          </Link>
        </div>

        {projects.length === 0 ? (
          <p className="font-mono text-sm text-neutral-500">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                featured
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
