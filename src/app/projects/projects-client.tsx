"use client";

import { useState, type JSX } from "react";
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

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredProjects = selectedCategory === "all"
    ? allProjects
    : allProjects.filter((p) => (p.category || "frontend") === selectedCategory);

  return (
    <div className="w-full text-(--terminal-text) font-mono transition-colors duration-300">
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
            <h2 className="mb-6 font-mono text-xl font-bold text-(--terminal-text)">
              <span className="text-(--terminal-accent)">$</span> ls --featured
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="font-mono text-xl font-bold text-(--terminal-text)">
              <span className="text-(--terminal-accent)">$</span> ls --category={selectedCategory}
            </h2>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {[
                { id: "all", label: "All" },
                { id: "frontend", label: "Frontend" },
                { id: "backend", label: "Backend" },
                { id: "fullstack", label: "Fullstack" },
                { id: "mobile-native", label: "Mobile" },
                { id: "desktop-native", label: "Desktop" },
                { id: "library", label: "Libraries" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1 rounded transition-colors border cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-(--terminal-accent) text-(--terminal-bg) border-(--terminal-accent) font-bold"
                      : "bg-(--terminal-bg)/70 text-(--terminal-muted) border-(--terminal-border) hover:border-(--terminal-accent)/40 hover:text-(--terminal-text)"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-lg border-(--terminal-border) text-(--terminal-muted) font-mono text-sm">
              No projects found for category &quot;{selectedCategory}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  featured={false}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/70 overflow-hidden">
            <div className="border-b sm:border-b-0 sm:border-r border-(--terminal-border) p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-(--terminal-muted)">
                <Folder size={14} />
                <span>{t("projectsTotalProjects")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-(--terminal-accent) tabular-nums">
                {allProjects.length}
              </div>
            </div>
            <div className="border-b sm:border-b-0 sm:border-r border-(--terminal-border) p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-(--terminal-muted)">
                <Star size={14} />
                <span>{t("projectsFeaturedStatus")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-(--terminal-accent) tabular-nums">
                {featuredProjects.length}
              </div>
            </div>
            <div className="border-b sm:border-b-0 sm:border-r border-(--terminal-border) p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-(--terminal-muted)">
                <Cpu size={14} />
                <span>{t("projectsTechnologiesStatus")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-(--terminal-accent) tabular-nums">
                {
                  Array.from(
                    new Set(allProjects.flatMap((p) => p.technologies)),
                  ).length
                }
              </div>
            </div>
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-(--terminal-muted)">
                <CheckCircle2 size={14} />
                <span>{t("projectsCompletedStatus")}</span>
              </div>
              <div className="font-mono text-sm font-bold text-(--terminal-accent) tabular-nums">
                {allProjects.filter((p) => p.status === "completed").length}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
