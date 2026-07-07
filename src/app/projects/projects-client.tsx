"use client";

import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Project } from "@/lib/data/data-fetching";
import { ProjectCard } from "@/components/molecules/projects/project-card";

interface ProjectsClientProps {
  allProjects: Project[];
  featuredProjects: Project[];
}

export function ProjectsClient({
  allProjects,
  featuredProjects,
}: ProjectsClientProps): JSX.Element {
  const { t, currentLocale } = useI18n();

  const getSubtitle = () => {
    if (currentLocale === "id_ID") {
      return `Koleksi ${allProjects.length} proyek pengembangan web yang menampilkan teknologi modern dan solusi kreatif.`;
    }
    if (currentLocale === "es_ES") {
      return `Una colección de ${allProjects.length} proyectos de desarrollo web que muestran tecnologías modernas y soluciones creativas.`;
    }
    return `A collection of ${allProjects.length} web development projects showcasing modern technologies and creative solutions.`;
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text">
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold font-mono mb-6">
              <span className="text-terminal-accent">~/</span>
              {t("projects")}
            </h1>
            <p className="text-xl md:text-2xl text-terminal-muted max-w-3xl mx-auto">
              {getSubtitle()}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {Array.from(new Set(allProjects.flatMap((p) => p.technologies)))
                .slice(0, 8)
                .map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 text-sm bg-terminal-accent/10 text-terminal-accent rounded-full border border-terminal-accent/20"
                  >
                    {tech}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {featuredProjects.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-mono mb-8 text-terminal-accent">
              {t("projectFeatured")} {t("projectsTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  featured={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold font-mono mb-8 text-terminal-text">
            {t("projectsAllProjects")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                featured={false}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-terminal-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {allProjects.length}
              </div>
              <div className="text-terminal-muted">
                {t("projectsTotalProjects")}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {featuredProjects.length}
              </div>
              <div className="text-terminal-muted">
                {t("projectsFeaturedStatus")}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {
                  Array.from(
                    new Set(allProjects.flatMap((p) => p.technologies)),
                  ).length
                }
              </div>
              <div className="text-terminal-muted">
                {t("projectsTechnologiesStatus")}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {allProjects.filter((p) => p.status === "completed").length}
              </div>
              <div className="text-terminal-muted">
                {t("projectsCompletedStatus")}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
