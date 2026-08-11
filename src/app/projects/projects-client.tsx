"use client";

import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Project } from "@/lib/data/data-fetching";
import { ProjectCard } from "@/components/molecules/projects/project-card";
import { PageHeader } from "@/components/atoms/shared/page-header";
import { TechBadge } from "@/components/atoms/tech-badge";
import { Folder, Star, Cpu, CheckCircle2 } from "lucide-react";

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
    <div className="w-full text-neutral-100">
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="projects"
            description={getSubtitle()}
          >
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(allProjects.flatMap((p) => p.technologies)))
                .slice(0, 8)
                .map((tech) => (
                  <TechBadge key={tech} name={tech} size="sm" />
                ))}
            </div>
          </PageHeader>
        </div>
      </section>

      {featuredProjects.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="mb-6 font-mono text-xl font-bold text-white">
              <span className="text-emerald-400">$</span> ls --featured
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

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-6 font-mono text-xl font-bold text-white">
            <span className="text-emerald-400">$</span> ls --all
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

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden">
            <div className="border-b sm:border-b-0 sm:border-r border-neutral-800 p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                <Folder size={14} />
                <span>{t("projectsTotalProjects")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {allProjects.length}
              </div>
            </div>
            <div className="border-b sm:border-b-0 sm:border-r border-neutral-800 p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                <Star size={14} />
                <span>{t("projectsFeaturedStatus")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {featuredProjects.length}
              </div>
            </div>
            <div className="border-b sm:border-b-0 sm:border-r border-neutral-800 p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                <Cpu size={14} />
                <span>{t("projectsTechnologiesStatus")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {
                  Array.from(
                    new Set(allProjects.flatMap((p) => p.technologies)),
                  ).length
                }
              </div>
            </div>
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                <CheckCircle2 size={14} />
                <span>{t("projectsCompletedStatus")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {allProjects.filter((p) => p.status === "completed").length}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
