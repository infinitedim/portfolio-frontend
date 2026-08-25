import { type Metadata } from "next";
import { type JSX, Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import {
  getProjectsData,
  type Project,
  type ProjectHighlight,
} from "@/lib/data/data-fetching";
import { BreadcrumbListSchema } from "@/components/molecules/seo/json-ld";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { ArrowLeft, ExternalLink, Code, Star } from "lucide-react";

import { TechBadge } from "@/components/atoms/tech-badge";
import { ProjectMetricsGrid } from "@/components/organisms/projects/project-metrics-grid";
import { ProjectMockupFrame } from "@/components/organisms/projects/project-mockup-frame";
import { ProjectEngineeringHighlights } from "@/components/organisms/projects/project-engineering-highlights";
import { ProjectCommitTracker } from "@/components/organisms/projects/project-commit-tracker";


interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ locale?: string }>;
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
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    return { title: "Project Case Study" };
  }
  const project = await findProject(slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  const canonicalPath = `/projects/${slug}`;

  return {
    title: project.name,
    description: project.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: `/projects/${slug}`,
        id: `/projects/${slug}?locale=id`,
        "x-default": `/projects/${slug}`,
      },
    },
    openGraph: {
      title: `${project.name} | Dimas Saputra`,
      description: project.description,
      type: "article",
      url: canonicalPath,
      locale: "en_US",
      alternateLocale: ["id_ID"],
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

                                                                          

const FRONTEND_KEYS = new Set([
  "react",
  "next.js",
  "nextjs",
  "typescript",
  "javascript",
  "tailwind",
  "tailwindcss",
  "tailwind css",
  "html",
  "css",
  "vue",
  "angular",
  "svelte",
  "framer motion",
  "radix",
  "radix ui",
]);

const DATA_KEYS = new Set([
  "postgresql",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "sqlite",
  "prisma",
  "drizzle",
  "sqlx",
  "graphql",
  "supabase",
  "firebase",
  "pgvector",
]);

interface TechCategory {
  readonly label: string;
  readonly items: string[];
}

function categorizeTechnologies(technologies: string[]): TechCategory[] {
  const frontend: string[] = [];
  const data: string[] = [];
  const infra: string[] = [];

  for (const tech of technologies) {
    const key = tech.toLowerCase().trim();
    if (FRONTEND_KEYS.has(key)) {
      frontend.push(tech);
    } else if (DATA_KEYS.has(key)) {
      data.push(tech);
    } else {
      infra.push(tech);
    }
  }

  const categories: TechCategory[] = [];
  if (frontend.length > 0) categories.push({ label: "Core Stack", items: frontend });
  if (data.length > 0) categories.push({ label: "Data & Cache", items: data });
  if (infra.length > 0)
    categories.push({ label: "Infrastructure & Tooling", items: infra });

  return categories;
}

                                                                          

function getDefaultHighlights(project: Project): ProjectHighlight[] | undefined {
  if (project.highlights && project.highlights.length > 0) {
    return project.highlights;
  }

                                                                                    
  if (!project.metrics) return undefined;

  return [
    {
      id: "arch",
      category: "Architecture",
      title: "Full-stack monorepo with Rust/Axum backend and Next.js 16 frontend",
      detail: "PostgreSQL, Redis rate limiting, WebSocket presence, PPR streaming",
    },
    {
      id: "perf",
      category: "Performance",
      title: "All API routes verified P95 < 35ms against documented SLA",
      detail: "CI smoke tests validate latency on every deploy",
    },
    {
      id: "security",
      category: "Security",
      title: "NATAS-style multi-level gate with session-based puzzle progression",
      detail: "JWT unlock tokens, bcrypt admin auth, TOTP 2FA",
    },
    {
      id: "observability",
      category: "Observability",
      title: "Prometheus metrics, structured tracing, and Grafana dashboards",
      detail: "Custom SLO rules with alert thresholds",
    },
  ];
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

                                              
  const related = allProjects
    .filter(
      (p) =>
        p.slug !== slug &&
        p.technologies.some((t) => project.technologies.includes(t)),
    )
    .slice(0, 3);

  const statusConfig = {
    completed: {
      color: "text-green-400",
      bg: "bg-green-400/10 border-green-400/20",
      label: "Completed",
    },
    "in-progress": {
      color: "text-yellow-400",
      bg: "bg-yellow-400/10 border-yellow-400/20",
      label: "In Progress",
    },
    planned: {
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20",
      label: "Planned",
    },
  };
  const status = statusConfig[project.status] ?? statusConfig.completed;
  const techCategories = categorizeTechnologies(project.technologies);
  const highlights = getDefaultHighlights(project);

                                                  
  let domain: string | undefined;
  if (project.demoUrl) {
    try {
      domain = new URL(project.demoUrl).hostname;
    } // eslint-disable-next-line no-empty
    catch {}
  }

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

                       
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-sm text-(--terminal-muted) transition-colors duration-200 hover:text-(--terminal-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--terminal-bg) rounded-sm"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          All projects
        </Link>
      </div>

                                                                          
      <article className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
                                          
            <div className="flex flex-col">
                                     
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-mono text-3xl font-bold tracking-tight text-(--terminal-text) sm:text-4xl">
                    {project.name}
                  </h1>
                  {project.featured && (
                    <span className="inline-flex items-center gap-1 rounded bg-(--terminal-accent)/10 px-2 py-1 text-xs font-medium text-(--terminal-accent)">
                      <Star
                        size={12}
                        className="fill-current"
                        aria-hidden="true"
                      />
                      Featured
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-xs ${status.color} ${status.bg}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

                                 
              <p className="mt-4 max-w-prose text-base leading-relaxed text-(--terminal-muted) sm:text-lg">
                {project.description}
              </p>

                                                         
              <div className="mt-6">
                <ProjectMetricsGrid metrics={project.metrics} />
              </div>

                                    
              <div className="mt-6 flex flex-wrap gap-3">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded bg-(--terminal-accent) px-5 py-2.5 font-mono text-sm font-medium text-(--terminal-bg) transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--terminal-bg)"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Live Demo
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded border border-(--terminal-border) px-5 py-2.5 font-mono text-sm text-(--terminal-text) transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-(--terminal-accent) hover:text-(--terminal-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--terminal-bg)"
                  >
                    <Code size={14} aria-hidden="true" />
                    Source Code
                  </a>
                )}
              </div>
            </div>

                                              
            {project.imageUrl && (
              <div className="flex items-start lg:pt-2">
                <ProjectMockupFrame
                  imageUrl={project.imageUrl}
                  projectName={project.name}
                  domain={domain}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </article>

                                                                           
      <div className="mx-auto max-w-6xl px-4 pb-2">
        <ProjectEngineeringHighlights highlights={highlights} />
      </div>

                                                                          
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-5 font-mono text-xl font-bold text-(--terminal-text)">
            <span className="text-(--terminal-accent)">$</span> tech --stack
          </h2>
          {techCategories.length > 0 ? (
            <div className="space-y-5">
              {techCategories.map((category) => (
                <div key={category.label}>
                  <h3 className="mb-2 font-mono text-xs font-medium uppercase tracking-wider text-(--terminal-muted)">
                    {category.label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((tech) => (
                      <TechBadge key={tech} name={tech} size="md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <TechBadge key={tech} name={tech} size="md" />
              ))}
            </div>
          )}
        </div>
      </section>

                                                                          
      <ProjectCommitTracker
        repoUrl={project.githubUrl}
        projectName={project.name}
      />

                                                                          
      {related.length > 0 && (
        <aside className="px-4 py-8 border-t border-(--terminal-border)">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 font-mono text-xl font-bold text-(--terminal-text)">
              <span className="text-(--terminal-accent)">$</span> ls --related
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/projects/${rp.slug}`}
                  className="group rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50 p-4 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-(--terminal-accent)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--terminal-bg)"
                >
                  <h3 className="font-mono text-sm font-semibold text-(--terminal-text) transition-colors duration-200 group-hover:text-(--terminal-accent)">
                    {rp.name}
                  </h3>
                  <p className="mt-1 text-xs text-(--terminal-muted) line-clamp-2">
                    {rp.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rp.technologies.slice(0, 3).map((t) => (
                      <TechBadge key={t} name={t} size="sm" variant="minimal" />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

function ProjectDetailFallback(): JSX.Element {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-6 w-24 animate-pulse rounded bg-(--terminal-border)" />
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-8">
          <div className="space-y-4">
            <div className="h-10 w-80 animate-pulse rounded bg-(--terminal-border)" />
            <div className="h-5 w-20 animate-pulse rounded bg-(--terminal-border)" />
            <div className="h-4 w-full animate-pulse rounded bg-(--terminal-border)" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-(--terminal-border)" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-(--terminal-border)" />
          </div>
          <div className="aspect-video animate-pulse rounded-lg bg-(--terminal-border)" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ params }: PageProps): JSX.Element {
  return (
    <StandardPageLayout>
      <Suspense fallback={<ProjectDetailFallback />}>
        <ProjectDetailContent params={params} />
      </Suspense>
    </StandardPageLayout>
  );
}
