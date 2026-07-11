"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Project } from "@/lib/data/data-fetching";
import { ProjectCard } from "@/components/molecules/projects/project-card";
import {
  FadeIn,
  StaggerContainer,
} from "@/components/atoms/shared/motion-wrappers";

interface FeaturedProjectsClientProps {
  projects: Project[];
}

export function FeaturedProjectsClient({
  projects,
}: FeaturedProjectsClientProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <FadeIn
          direction="up"
          duration={0.5}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <h2 className="font-mono text-2xl font-bold text-green-400">
            {t("landingProjectsTitle")}
          </h2>
          <Link
            href="/projects"
            prefetch={false}
            className="font-mono text-xs text-neutral-400 transition-colors hover:text-green-400"
          >
            {t("projectsViewAll")} →
          </Link>
        </FadeIn>

        {projects.length === 0 ? (
          <p className="font-mono text-sm text-neutral-400">
            {t("projectsNone")}
          </p>
        ) : (
          <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project, index) => (
              <FadeIn
                key={project.id}
                direction="up"
                delay={index * 0.1}
                duration={0.5}
              >
                <ProjectCard
                  project={project}
                  featured
                />
              </FadeIn>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
