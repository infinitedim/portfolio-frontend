import { type Metadata } from "next";
import { type JSX, Suspense } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import {
  getAboutData,
  getExperienceData,
} from "@/lib/data/data-fetching";
import {
  BreadcrumbListSchema,
  PersonSchema,
} from "@/components/molecules/seo/json-ld";
import { getSiteUrl } from "@/lib/api/get-site-url";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Dimas Saputra — a full-stack developer specializing in React, Next.js, TypeScript, Rust, and modern web technologies.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Dimas Saputra",
    description:
      "Full-stack developer — experience, skills, and background.",
    type: "profile",
    url: "/about",
  },
};

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
    items: [
      "Flutter",
      "Git",
      "Figma",
      "Linux",
      "PWA",
    ],
  },
] as const;

async function AboutContent(): Promise<JSX.Element> {
  const [about, experience] = await Promise.all([
    getAboutData(),
    getExperienceData(),
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

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-green-900/20 via-neutral-950 to-neutral-950" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
            <span className="text-green-400">~/</span>about
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-base text-neutral-400 sm:text-lg">
            {about.bio}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-neutral-400">
            <span>📍 {about.location}</span>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${about.contact.email}`}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              {about.contact.email}
            </a>
          </div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 font-mono text-2xl font-bold text-white">
            <span className="text-green-400">$</span> work --history
          </h2>

          <div className="relative border-l-2 border-neutral-800 pl-6 space-y-10">
            {experience.map((exp, i) => (
              <div key={`${exp.company}-${i}`} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-7.75 top-1 h-4 w-4 rounded-full border-2 border-green-400 bg-neutral-950" />

                <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="font-mono text-lg font-semibold text-white">
                      {exp.position}
                    </h3>
                    <span className="font-mono text-xs text-neutral-400">
                      {exp.duration}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm text-green-400">
                    @ {exp.company}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {exp.description.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 font-mono text-sm text-neutral-400"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-400/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {exp.technologies.length > 0 && (
                    <ul aria-label="Technologies used" className="mt-3 flex flex-wrap gap-1.5">
                      {exp.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded border border-green-400/20 bg-green-400/5 px-2 py-0.5 font-mono text-xs text-green-400"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section id="skills" className="px-4 py-12 sm:px-6 scroll-mt-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 font-mono text-2xl font-bold text-white">
            <span className="text-green-400">$</span> skills --list
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {SKILL_GROUPS.map((group) => (
              <div
                key={group.label}
                className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5"
              >
                <h3 className="mb-3 font-mono text-sm font-bold text-green-400">
                  {group.label}
                </h3>
                <ul aria-label="Skills list" className="flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <li
                      key={skill}
                      className="rounded bg-neutral-800 px-2.5 py-1 font-mono text-xs text-neutral-300"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-8">
            <p className="font-mono text-sm text-neutral-400">
              Interested in working together?
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/resume.pdf"
                download
                className="rounded bg-green-400 px-5 py-2.5 font-mono text-sm font-medium text-neutral-950 transition-colors hover:bg-green-300"
              >
                ↓ Download Resume
              </a>
              <a
                href="/contact"
                className="rounded border border-neutral-700 px-5 py-2.5 font-mono text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
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

function AboutFallback(): JSX.Element {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
        <div className="mt-12 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <Suspense fallback={<AboutFallback />}>
        <AboutContent />
      </Suspense>
    </StandardPageLayout>
  );
}
