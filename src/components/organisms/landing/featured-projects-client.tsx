"use client";

import Link from "next/link";
import { type JSX } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { Project } from "@/lib/data/data-fetching";
import { ProjectCard } from "@/components/molecules/projects/project-card";
import {
  FadeIn,
  StaggerContainer,
} from "@/components/atoms/shared/motion-wrappers";

/**
 * Props for the {@link FeaturedProjectsClient} component.
 */
interface FeaturedProjectsClientProps {
  /**
   * List of projects to display in the featured showcase.
   */
  projects: Project[];
}

/**
 * Client-side component displaying the featured projects showcase on the landing page.
 *
 * @description
 * Renders a terminal-styled `$ ls --featured` section containing up to 3 highlighted projects
 * using animated stagger and fade motion wrappers. If no projects are available, displays a localized empty state.
 *
 * @param props - The component props.
 * @param props.projects - Array of project items to showcase.
 * @returns The rendered featured projects section JSX element.
 */
export function FeaturedProjectsClient({
  projects,
}: FeaturedProjectsClientProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="border-t border-(--terminal-border) px-4 py-16 cv-auto-section transition-colors duration-300">
      <div className="mx-auto max-w-6xl">
        <FadeIn
          direction="up"
          duration={0.5}
          className="mb-8 flex items-end justify-between gap-4 font-mono"
        >
          <h2 className="font-mono text-xl font-bold text-(--terminal-text)">
            <span className="text-(--terminal-accent)">$</span> ls --featured
          </h2>
          <Link
            href="/projects"
            prefetch={false}
            className="group inline-flex items-center gap-1 font-mono text-xs text-(--terminal-muted) transition-colors duration-200 hover:text-(--terminal-accent)"
          >
            {t("projectsViewAll")}
            <ArrowRight
              size={14}
              className="transition-transform duration-200 ease-out group-hover:translate-x-1"
            />
          </Link>
        </FadeIn>

        {projects.length === 0 ? (
          <p className="font-mono text-sm text-(--terminal-muted)">
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
