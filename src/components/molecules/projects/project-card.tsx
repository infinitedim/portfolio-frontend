import { memo, JSX, Suspense } from "react";
import { Project } from "@/lib/data/data-fetching";
import { ProjectCardImage } from "@/components/molecules/projects/project-card-image";
import { ImageErrorBoundary } from "@/components/organisms/error/image-error-boundary";
import { Star, Folder } from "lucide-react";
import { HoverCard } from "@/components/atoms/shared/motion-wrappers";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

const ProjectImageLoader = () => (
  <div className="h-48 animate-pulse bg-terminal-muted/10" />
);

export const ProjectCard = memo(function ProjectCard({
  project,
  featured = false,
}: ProjectCardProps): JSX.Element {
  const statusConfig = {
    completed: { color: "text-green-400", icon: "", label: "Completed" },
    "in-progress": {
      color: "text-yellow-400",
      icon: "",
      label: "In Progress",
    },
    planned: { color: "text-blue-400", icon: "", label: "Planned" },
  };

  const status = statusConfig[project.status] ?? statusConfig.completed;

  return (
    <HoverCard
      className={`
        group relative overflow-hidden rounded-lg border border-terminal-border bg-terminal-bg
        transition-all duration-300 hover:border-terminal-accent hover:shadow-lg
        ${featured ? "ring-2 ring-terminal-accent ring-opacity-20" : ""}
      `}
    >
      <article
        itemScope
        itemType="https://schema.org/CreativeWork"
        className="h-full flex flex-col"
      >
        {featured && (
          <div className="absolute right-4 top-4 z-10">
          <span className="rounded bg-terminal-accent px-2 py-1 text-xs font-bold text-terminal-bg flex items-center gap-1">
            <Star
              size={12}
              className="fill-current"
            />{" "}
            FEATURED
          </span>
        </div>
      )}

      <div className="relative h-48 overflow-hidden bg-terminal-muted/10">
        <Suspense fallback={<ProjectImageLoader />}>
          <ImageErrorBoundary>
            {project.imageUrl ? (
              <ProjectCardImage
                src={project.imageUrl}
                alt={`Screenshot of ${project.name}`}
                featured={featured}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-terminal-muted">
                <div className="text-center flex flex-col items-center">
                  <div className="mb-2 text-terminal-muted">
                    <Folder
                      size={36}
                      className="stroke-[1.5]"
                    />
                  </div>
                  <div className="text-sm">Project Preview</div>
                </div>
              </div>
            )}
          </ImageErrorBoundary>
        </Suspense>

        <div className="absolute bottom-2 right-2 rounded bg-terminal-bg/80 px-2 py-1 backdrop-blur-sm">
          <span
            className={`${status.color} flex items-center gap-1 font-mono text-sm`}
          >
            <span>{status.icon}</span>
            <span>{status.label}</span>
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h3
            className="mb-2 text-xl font-bold text-terminal-text transition-colors group-hover:text-terminal-accent"
            itemProp="name"
          >
            {project.name}
          </h3>
          <p
            className="text-sm leading-relaxed text-terminal-muted"
            itemProp="description"
          >
            {project.description}
          </p>
        </div>

        <div className="mb-4">
          <div className="mb-2 font-mono text-xs text-terminal-muted">
            TECH STACK:
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="rounded border border-terminal-accent/20 bg-terminal-accent/10 px-2 py-1 font-mono text-xs text-terminal-accent"
                itemProp="programmingLanguage"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-muted">
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded bg-terminal-accent px-4 py-2 text-center text-sm font-medium text-terminal-bg transition-colors hover:bg-terminal-accent/90"
              aria-label={`View live demo of ${project.name}`}
            >
              Live Demo
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded border border-terminal-border px-4 py-2 text-center text-sm font-medium text-terminal-text transition-colors hover:border-terminal-accent hover:text-terminal-accent"
              aria-label={`View source code of ${project.name}`}
            >
              Code
            </a>
          )}
        </div>

        <meta
          itemProp="url"
          content={project.demoUrl || project.githubUrl}
        />
        <meta
          itemProp="creativeWorkStatus"
          content={project.status}
        />
        <div
          itemProp="author"
          itemScope
          itemType="https://schema.org/Person"
          className="hidden"
        >
          <meta
            itemProp="name"
            content="Developer Portfolio"
          />
        </div>
      </div>
    </article>
    </HoverCard>
  );
});
