import { type Metadata } from "next";
import { type JSX, Suspense } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PageHeader } from "@/components/atoms/shared/page-header";
import { getAboutData, getExperienceData } from "@/lib/data/data-fetching";
import {
  BreadcrumbListSchema,
  PersonSchema,
} from "@/components/molecules/seo/json-ld";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { Mail } from "lucide-react";
import { AboutResumeButton } from "@/components/molecules/about/about-resume-button";
import { TechBadge } from "@/components/atoms/tech-badge";

/**
 * Static metadata configuration for the About page.
 *
 * @description
 * Defines OpenGraph metadata, page title, description, and canonical URL
 * for search engine optimization (SEO) and social media link previews.
 */
export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Dimas Saputra — a full-stack developer specializing in React, Next.js, TypeScript, Rust, and modern web technologies.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Dimas Saputra",
    description: "Full-stack developer — experience, skills, and background.",
    type: "profile",
    url: "/about",
  },
};

/**
 * Categorized list of technical skills and toolsets displayed on the About page.
 *
 * @description
 * Groups developer proficiencies into distinct domains (Frontend, Backend, DevOps & Tooling, Other)
 * to render structured skill badges in the skills section grid.
 */
const SKILL_GROUPS = [
  {
    label: "Frontend",
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Radix UI",
      "Framer Motion",
    ],
  },
  {
    label: "Backend",
    items: [
      "Rust / Axum",
      "Node.js",
      "PostgreSQL",
      "Redis",
      "REST & WebSocket",
    ],
  },
  {
    label: "DevOps & Tooling",
    items: [
      "Docker",
      "GCP Cloud Run",
      "Terraform",
      "GitHub Actions",
      "Prometheus / Grafana",
    ],
  },
  {
    label: "Other",
    items: ["Flutter", "Git", "Figma", "Linux", "PWA"],
  },
] as const;

/**
 * Server component that fetches and renders the complete About page content.
 *
 * @description
 * Retrieves localized developer profile and work experience data based on the user's
 * active `portfolio_locale` cookie. Renders structured JSON-LD schemas (Person, BreadcrumbList),
 * an introductory hero section with contact details, an interactive work history timeline,
 * a categorized technical skills showcase, and a call-to-action section with resume access.
 *
 * @returns {Promise<JSX.Element>} A promise resolving to the rendered About page sections and JSON-LD scripts.
 */
async function AboutContent(): Promise<JSX.Element> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const locale = cookieStore.get("portfolio_locale")?.value ?? "en_US";

  const [about, experience] = await Promise.all([
    getAboutData(locale),
    getExperienceData(locale),
  ]);
  const siteUrl = getSiteUrl();

  return (
    <>
      <PersonSchema
        name={about.name}
        url={siteUrl}
        jobTitle={about.title}
        description={about.bio}
        sameAs={[
          about.contact.github,
          about.contact.linkedin,
          ...(about.contact.twitter ? [about.contact.twitter] : []),
        ]}
        knowsAbout={[
          "React",
          "Next.js",
          "TypeScript",
          "Rust",
          "Full-Stack Development",
        ]}
      />
      <BreadcrumbListSchema
        items={[
          { name: "Home", item: siteUrl },
          { name: "About", item: `${siteUrl}/about` },
        ]}
      />

                  
      <section className="relative overflow-hidden px-4 py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-(--terminal-accent)/10 via-(--terminal-bg) to-(--terminal-bg)" />
        <div className="relative mx-auto max-w-6xl">
          <PageHeader
            title="about"
            description={about.bio}
          >
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-(--terminal-muted)">
              <a
                href={`mailto:${about.contact.email}`}
                className="inline-flex items-center gap-1.5 text-(--terminal-accent) hover:opacity-80 transition-opacity duration-200"
              >
                <Mail className="h-3.5 w-3.5" />
                {about.contact.email}
              </a>
            </div>
          </PageHeader>
        </div>
      </section>

                                 
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 font-mono text-2xl font-bold text-(--terminal-text)">
            <span className="text-(--terminal-accent)">$</span> work --history
          </h2>

          <div className="relative border-l-2 border-(--terminal-border)/80 pl-6 space-y-10">
            {experience.map((exp, i) => {
              const isCurrent = exp.duration.toLowerCase().includes("present");
              return (
                <div
                  key={`${exp.company}-${i}`}
                  className="group relative"
                >
                                                                                    
                  <div className="absolute -left-8.25 top-6 flex h-4 w-4 items-center justify-center">
                    {isCurrent ? (
                      <>
                                                                      
                        <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-(--terminal-accent)/60 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-(--terminal-accent) shadow-[0_0_10px_var(--terminal-accent)] transition-transform duration-300 group-hover:scale-125" />
                      </>
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full border border-(--terminal-accent)/40 bg-(--terminal-bg) transition-all duration-300 group-hover:scale-125 group-hover:border-(--terminal-accent)">
                        <span className="h-1.5 w-1.5 rounded-full bg-(--terminal-accent)/60 transition-all duration-300 group-hover:bg-(--terminal-accent) group-hover:scale-125" />
                      </div>
                    )}
                  </div>

                                         
                  <div className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50 p-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-lg font-semibold text-(--terminal-text)">
                          {exp.position}
                        </h3>
                        {exp.type && (
                          <span className="rounded border border-(--terminal-accent)/30 bg-(--terminal-accent)/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-(--terminal-accent)">
                            {exp.type.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-(--terminal-muted)">
                        {exp.duration}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-sm text-(--terminal-accent) font-semibold">
                      @ {exp.company}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {exp.description.map((item, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 font-mono text-sm text-(--terminal-muted)"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--terminal-accent)/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {exp.technologies.length > 0 && (
                      <ul
                        aria-label="Technologies used"
                        className="mt-3 flex flex-wrap gap-1.5"
                      >
                        {exp.technologies.map((tech) => (
                          <li key={tech}>
                            <TechBadge
                              name={tech}
                              size="sm"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

                         
      <section
        id="skills"
        className="px-4 py-12 scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 font-mono text-2xl font-bold text-(--terminal-text)">
            <span className="text-(--terminal-accent)">$</span> skills --list
          </h2>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {SKILL_GROUPS.map((group) => (
              <div
                key={group.label}
                className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50 p-5"
              >
                <h3 className="mb-3 font-mono text-sm font-bold text-(--terminal-accent)">
                  {group.label}
                </h3>
                <ul
                  aria-label="Skills list"
                  className="flex flex-wrap gap-2"
                >
                  {group.items.map((skill) => (
                    <li key={skill}>
                      <TechBadge
                        name={skill}
                        size="sm"
                        variant="outline"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

                 
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-5 font-mono text-xl font-bold text-(--terminal-text)">
            <span className="text-(--terminal-accent)">$</span> next --step
          </h2>
          <div className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50 p-8">
            <p className="font-mono text-sm text-(--terminal-muted)">
              Interested in working together?
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <AboutResumeButton />
              <a
                href="/contact"
                className="rounded border border-(--terminal-border) px-5 py-2.5 font-mono text-sm text-(--terminal-text) transition-colors duration-200 hover:border-(--terminal-accent) hover:text-(--terminal-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--terminal-bg)"
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Fallback skeleton component displayed while the server-rendered AboutContent is streaming.
 *
 * @description
 * Renders placeholder animated pulse blocks corresponding to the header, bio summary,
 * and experience timeline cards inside a Suspense boundary.
 *
 * @returns {JSX.Element} Skeleton loading placeholder for the About page content.
 */
function AboutFallback(): JSX.Element {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-(--terminal-border)" />
        <div className="h-4 w-full animate-pulse rounded bg-(--terminal-border)" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-(--terminal-border)" />
        <div className="mt-12 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Root page component for the public `/about` route.
 *
 * @description
 * Wraps the asynchronous server component {@link AboutContent} within a React Suspense
 * boundary and the global {@link StandardPageLayout}, displaying {@link AboutFallback}
 * during data streaming.
 *
 * @returns {JSX.Element} The rendered About page layout with Suspense streaming.
 */
export default function AboutPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <Suspense fallback={<AboutFallback />}>
        <AboutContent />
      </Suspense>
    </StandardPageLayout>
  );
}
