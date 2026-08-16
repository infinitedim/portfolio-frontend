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
  <div className="h-48 animate-pulse bg-neutral-800/30" />
);

export const ProjectCard = memo(function ProjectCard({
  project,
  featured = false,
}: ProjectCardProps): JSX.Element {
  const { t } = useI18n();

  const statusConfig = {
    completed: {
      color: "text-emerald-400",
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

  // Determine main media image (Architecture image for backend if available, or imageUrl)
  const displayImage = project.imageUrl || project.architectureImageUrl;

  return (
    <HoverCard
      className={`
        h-full group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950
        transition-colors duration-200 hover:border-emerald-400/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.06)]
        ${featured ? "ring-2 ring-emerald-400 ring-opacity-20" : ""}
      `}
    >
      <article
        itemScope
        itemType="https://schema.org/CreativeWork"
        className="h-full flex flex-col"
        suppressHydrationWarning
      >
        {featured && (
          <div className="absolute right-4 top-4 z-10">
            <span className="rounded bg-emerald-400 px-2 py-1 text-xs font-bold text-neutral-950 flex items-center gap-1">
              <Star
                size={12}
                className="fill-current"
              />{" "}
              {t("projectFeatured")}
            </span>
          </div>
        )}

        <div className="relative h-48 overflow-hidden bg-neutral-800/30">
          <Suspense fallback={<ProjectImageLoader />}>
            <ImageErrorBoundary>
              {displayImage ? (
                <ProjectCardImage
                  src={displayImage}
                  alt={`Screenshot of ${project.name}`}
                  featured={featured}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  <div className="text-center flex flex-col items-center">
                    <div className="mb-2 text-neutral-400">
                      <Folder
                        size={36}
                        className="stroke-[1.5]"
                      />
                    </div>
                    <div className="text-sm">{t("projectPreview")}</div>
                  </div>
                </div>
              )}
            </ImageErrorBoundary>
          </Suspense>

          <div className="absolute bottom-2 right-2 rounded bg-neutral-950/80 px-2 py-1 backdrop-blur-sm">
            <span
              className={`${status.color} flex items-center gap-1 font-mono text-sm`}
            >
              <span>{status.icon}</span>
              <span>{status.label}</span>
            </span>
          </div>

          {project.category && (
            <div className="absolute top-2 left-2 rounded bg-neutral-950/80 px-2 py-0.5 backdrop-blur-sm border border-neutral-800 font-mono text-[10px] uppercase text-neutral-300">
              {project.category}
            </div>
          )}
        </div>

        <div className="p-6 flex flex-1 flex-col">
          {/* Target Platform Badges */}
          {project.platforms && project.platforms.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {project.platforms.map((platform) => (
                <PlatformBadge key={platform} platform={platform} size="sm" />
              ))}
            </div>
          )}

          <div className="mb-4">
            <h3
              className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-emerald-400"
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
              className="text-sm leading-relaxed text-neutral-400"
              itemProp="description"
            >
              {project.description}
            </p>
          </div>

          {/* Key Metrics Pills */}
          {project.metrics && (
            <div className="mb-4 flex flex-wrap gap-1.5 font-mono text-[11px]">
              {project.metrics.latencyP95 && (
                <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-950/20 px-2 py-0.5 text-emerald-400">
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
            <div className="mb-2 font-mono text-xs text-neutral-500">
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
                <li className="rounded border border-neutral-800 px-2 py-1 font-mono text-xs text-neutral-500">
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
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/30"
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
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-emerald-400 px-3 py-1.5 text-center text-xs font-medium text-neutral-950 transition-colors hover:bg-emerald-300"
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
                className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-neutral-700 px-3 py-1.5 text-center text-xs font-medium text-neutral-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-400"
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
