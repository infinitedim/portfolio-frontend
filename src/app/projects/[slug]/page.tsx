import { type Metadata } from "next";
import { type JSX, Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { getProjectsData, type Project } from "@/lib/data/data-fetching";
import {
  BreadcrumbListSchema,
} from "@/components/molecules/seo/json-ld";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { ArrowLeft, ExternalLink, Code, Star } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const BUILD_PLACEHOLDER_SLUG = "__build_placeholder__";

async function findProject(slug: string): Promise<Project | null> {
  const projects = await getProjectsData();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const projects = await getProjectsData();
    const slugs = (projects || []).map((p) => ({ slug: p.slug }));
    if (slugs.length > 0) {
      return slugs;
    }
  } catch (error) {
    console.error("Failed to generate static params for projects:", error);
  }
  return [{ slug: BUILD_PLACEHOLDER_SLUG }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    return { title: "Project Case Study" };
  }
  const project = await findProject(slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: project.name,
    description: project.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${project.name} | Dimas Saputra`,
      description: project.description,
      type: "article",
      url: `/projects/${slug}`,
      ...(project.imageUrl && {
        images: [
          {
            url: project.imageUrl,
            width: 1200,
            height: 630,
            alt: project.name,
          },
        ],
      }),
    },
  };
}

async function ProjectDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    notFound();
  }
  const project = await findProject(slug);
  if (!project) notFound();

  const allProjects = await getProjectsData();
  const siteUrl = getSiteUrl();

  // Find related projects (same tech overlap)
  const related = allProjects
    .filter(
      (p) =>
        p.slug !== slug &&
        p.technologies.some((t) => project.technologies.includes(t)),
    )
    .slice(0, 3);

  const statusConfig = {
    completed: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", label: "Completed" },
    "in-progress": { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", label: "In Progress" },
    planned: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", label: "Planned" },
  };
  const status = statusConfig[project.status] ?? statusConfig.completed;

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", item: siteUrl },
          { name: "Projects", item: `${siteUrl}/projects` },
          { name: project.name, item: `${siteUrl}/projects/${slug}` },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: project.name,
            description: project.description,
            programmingLanguage: project.technologies,
            ...(project.githubUrl && { codeRepository: project.githubUrl }),
            ...(project.demoUrl && { url: project.demoUrl }),
            author: {
              "@type": "Person",
              name: "Dimas Saputra",
            },
          }),
        }}
      />

      {/* Back link */}
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-sm text-neutral-400 transition-colors hover:text-green-400"
        >
          <ArrowLeft size={14} />
          All projects
        </Link>
      </div>

      {/* Hero */}
      <section className="px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6">
            {/* Project image */}
            {project.imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-800">
                <Image
                  src={project.imageUrl}
                  alt={`Screenshot of ${project.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                  priority
                />
              </div>
            )}

            {/* Title & meta */}
            <div>
              <div className="flex items-start gap-3">
                <h1 className="font-mono text-3xl font-bold text-white sm:text-4xl">
                  {project.name}
                </h1>
                {project.featured && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400">
                    <Star size={12} className="fill-current" />
                    Featured
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-xs ${status.color} ${status.bg}`}
                >
                  {status.label}
                </span>
              </div>

              <p className="mt-4 text-base leading-relaxed text-neutral-400 sm:text-lg">
                {project.description}
              </p>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded bg-green-400 px-5 py-2.5 font-mono text-sm font-medium text-neutral-950 transition-colors hover:bg-green-300"
                  >
                    <ExternalLink size={14} />
                    Live Demo
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded border border-neutral-700 px-5 py-2.5 font-mono text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
                  >
                    <Code size={14} />
                    Source Code
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 font-mono text-xl font-bold text-white">
            <span className="text-green-400">$</span> tech --stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded border border-green-400/20 bg-green-400/10 px-3 py-1.5 font-mono text-sm text-green-400"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Related projects */}
      {related.length > 0 && (
        <section className="px-4 py-8 sm:px-6 border-t border-neutral-800">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-mono text-xl font-bold text-white">
              <span className="text-green-400">$</span> ls --related
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/projects/${rp.slug}`}
                  className="group rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-green-400/40"
                >
                  <h3 className="font-mono text-sm font-semibold text-white group-hover:text-green-400 transition-colors">
                    {rp.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                    {rp.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rp.technologies.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function ProjectDetailFallback(): JSX.Element {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-6 w-24 animate-pulse rounded bg-neutral-800" />
        <div className="aspect-video animate-pulse rounded-lg bg-neutral-800" />
        <div className="h-8 w-64 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
      </div>
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: PageProps): JSX.Element {
  return (
    <StandardPageLayout>
      <Suspense fallback={<ProjectDetailFallback />}>
        <ProjectDetailContent params={params} />
      </Suspense>
    </StandardPageLayout>
  );
}
