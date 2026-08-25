import { memo, JSX, Suspense } from "react";
import Link from "next/link";
import { Project } from "@/lib/data/data-fetching";
import { ProjectCardImage } from "@/components/molecules/projects/project-card-image";
import { ImageErrorBoundary } from "@/components/organisms/error/image-error-boundary";
import { PlatformBadge } from "@/components/atoms/platform-badge";
import { Star, Folder, ExternalLink, Download, FileCode, Package, Gauge, Zap, ShieldCheck } from "lucide-react";
import { HoverCard } from "@/components/atoms/shared/motion-wrappers";

import { useI18n } from "@/hooks/use-i18n";
import { TechBadge } from "@/components/atoms/tech-badge";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

const ProjectImageLoader = () => (
  <div className="h-48 animate-pulse bg-(--terminal-border)/30" />
);

export const ProjectCard = memo(function ProjectCard({
  project,
  featured = false,
}: ProjectCardProps): JSX.Element {
  const { t } = useI18n();

  const statusConfig = {
    completed: {
      color: "text-(--terminal-accent)",
      icon: "",
      label: t("projectsCompletedStatus"),
    },
    "in-progress": {
      color: "text-yellow-400",
      icon: "",
      label: t("skillsInProgress"),
    },
    planned: { color: "text-blue-400", icon: "", label: t("skillsNotStarted") },
  };

  const status = statusConfig[project.status] ?? statusConfig.completed;

                                                                                          
  const displayImage = project.imageUrl || project.architectureImageUrl;

  return (
    <HoverCard
      className={`
        h-full group relative overflow-hidden rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/90
        transition-colors duration-200 hover:border-(--terminal-accent)/60
        ${featured ? "ring-2 ring-(--terminal-accent) ring-opacity-30" : ""}
      `}
    >
      <article
        itemScope
        itemType="https://schema.org/CreativeWork"
        className="h-full flex flex-col p-5"
        suppressHydrationWarning
      >
                                         
        <div className="relative mb-4 overflow-hidden rounded border border-(--terminal-border) bg-(--terminal-bg)">
          {displayImage ? (
            <ImageErrorBoundary
              fallback={
                <div className="h-48 flex flex-col items-center justify-center bg-(--terminal-bg) p-4 text-center font-mono border border-(--terminal-border)">
                  <Folder className="h-8 w-8 text-(--terminal-accent) mb-2 opacity-60" />
                  <span className="text-xs text-(--terminal-muted) truncate max-w-full">
                    {project.name}
                  </span>
                </div>
              }
            >
              <Suspense fallback={<ProjectImageLoader />}>
                <ProjectCardImage
                  src={displayImage}
                  alt={project.name}
                  featured={featured}
                  className="h-48 w-full object-cover object-top transition-transform duration-300 group-hover:scale-102"
                />
              </Suspense>
            </ImageErrorBoundary>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-(--terminal-bg) p-4 text-center font-mono border border-(--terminal-border) group-hover:border-(--terminal-accent)/40 transition-colors">
              <Folder className="h-10 w-10 text-(--terminal-accent) mb-2 opacity-80 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-(--terminal-text) truncate max-w-full">
                {project.name}
              </span>
              <span className="text-[10px] text-(--terminal-muted) mt-1">
                {project.category}
              </span>
            </div>
          )}

                                
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            {project.featured && (
              <span className="inline-flex items-center gap-1 rounded bg-(--terminal-accent)/20 border border-(--terminal-accent)/40 px-2 py-0.5 font-mono text-[10px] font-medium text-(--terminal-accent) backdrop-blur-md">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </span>
            )}
            <span className="inline-flex items-center rounded bg-(--terminal-bg)/80 border border-(--terminal-border) px-2 py-0.5 font-mono text-[10px] text-(--terminal-muted) backdrop-blur-md">
              {project.category}
            </span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
            {project.platforms?.map((platform) => (
              <PlatformBadge key={platform} platform={platform} />
            ))}
          </div>
        </div>

                                   
        <div className="flex flex-col flex-grow">
          <div className="mb-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${status.color}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {status.label}
              </span>
            </div>
            <h3
              className="font-mono text-lg font-bold tracking-tight text-(--terminal-text) transition-colors group-hover:text-(--terminal-accent)"
              itemProp="name"
            >
              <Link
                href={`/projects/${project.slug}`}
                className="hover:underline after:absolute after:inset-0 after:z-0"
              >
                {project.name}
              </Link>
            </h3>
            <p
              className="text-sm leading-relaxed text-(--terminal-muted)"
              itemProp="description"
            >
              {project.description}
            </p>
          </div>

                                   
          {project.metrics && (
            <div className="mb-4 flex flex-wrap gap-1.5 font-mono text-[11px]">
              {project.metrics.latencyP95 && (
                <span className="inline-flex items-center gap-1 rounded border border-(--terminal-accent)/30 bg-(--terminal-accent)/10 px-2 py-0.5 text-(--terminal-accent)">
                  <Zap className="h-3 w-3" /> P95: {project.metrics.latencyP95}
                </span>
              )}
              {project.metrics.throughputRps && (
                <span className="inline-flex items-center gap-1 rounded border border-sky-500/30 bg-sky-950/20 px-2 py-0.5 text-sky-400">
                  <Gauge className="h-3 w-3" /> {project.metrics.throughputRps}
                </span>
              )}
              {project.metrics.uptimeSla && (
                <span className="inline-flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-950/20 px-2 py-0.5 text-indigo-400">
                  <ShieldCheck className="h-3 w-3" /> SLA: {project.metrics.uptimeSla}
                </span>
              )}
              {project.metrics.appSize && (
                <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-950/20 px-2 py-0.5 text-amber-400">
                  <Package className="h-3 w-3" /> Size: {project.metrics.appSize}
                </span>
              )}
              {project.metrics.lighthouseScore !== undefined && (
                <span className="inline-flex items-center gap-1 rounded border border-teal-500/30 bg-teal-950/20 px-2 py-0.5 text-teal-400">
                  <Zap className="h-3 w-3" /> LH: {project.metrics.lighthouseScore}
                </span>
              )}
            </div>
          )}

          <div className="mb-4">
            <div className="mb-2 font-mono text-xs text-(--terminal-muted)">
              {t("projectTechStack")}:
            </div>
            <ul
              aria-label="Technologies used"
              className="flex flex-wrap gap-2"
            >
              {project.technologies.slice(0, 4).map((tech) => (
                <li key={tech} itemProp="programmingLanguage">
                  <TechBadge name={tech} size="sm" />
                </li>
              ))}
              {project.technologies.length > 4 && (
                <li className="rounded border border-(--terminal-border) px-2 py-1 font-mono text-xs text-(--terminal-muted)">
                  +{project.technologies.length - 4} {t("projectMore")}
                </li>
              )}
            </ul>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 relative z-10">
            {project.apiDocsUrl && (
              <a
                href={project.apiDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-(--terminal-accent)/20 border border-(--terminal-accent)/40 px-3 py-1.5 text-xs font-medium text-(--terminal-accent) transition-colors hover:bg-(--terminal-accent)/30"
                aria-label={`API Docs for ${project.name}`}
              >
                <FileCode className="h-3.5 w-3.5" /> API Docs
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-(--terminal-accent) px-3 py-1.5 text-center text-xs font-medium text-(--terminal-bg) transition-colors hover:opacity-90 font-semibold"
                aria-label={`View live demo of ${project.name}`}
              >
                <ExternalLink className="h-3.5 w-3.5" /> {t("projectLiveDemo")}
              </a>
            )}
            {project.playStoreUrl && (
              <a
                href={project.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/60"
              >
                Google Play
              </a>
            )}
            {project.appStoreUrl && (
              <a
                href={project.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-indigo-950/60 border border-indigo-500/40 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-900/60"
              >
                App Store
              </a>
            )}
            {project.downloadUrl && (
              <a
                href={project.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-sky-950/60 border border-sky-500/40 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-900/60"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            )}
            {project.packageUrl && (
              <a
                href={project.packageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-900/60"
              >
                <Package className="h-3.5 w-3.5" /> Package
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-(--terminal-border) px-3 py-1.5 text-center text-xs font-medium text-(--terminal-muted) transition-colors hover:border-(--terminal-accent)/60 hover:text-(--terminal-accent)"
                aria-label={`View source code of ${project.name}`}
              >
                {t("projectCode")}
              </a>
            )}
          </div>

          <meta
            itemProp="url"
            content={project.demoUrl || project.githubUrl || project.apiDocsUrl}
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
