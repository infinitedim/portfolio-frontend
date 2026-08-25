import { Metadata } from "next";
import { type JSX, Suspense } from "react";
import { HeroSection } from "@/components/organisms/landing/hero-section";
import { AboutSection } from "@/components/organisms/landing/about-section";
import { FeaturedProjects } from "@/components/organisms/landing/featured-projects";
import { LatestPosts } from "@/components/organisms/landing/latest-posts";
import { LandingSectionSkeleton } from "@/components/organisms/landing/landing-section-skeleton";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { TerminalCta } from "@/components/organisms/landing/terminal-cta";

/**
 * Root landing page metadata configuration for OpenGraph, Twitter cards, and SEO.
 *
 * @description Provides search engines and social platforms with localized titles,
 * descriptions, keywords, canonical URLs, and image previews for the portfolio homepage.
 */
export const metadata: Metadata = {
  title: "Dimas Saputra | Full-Stack Developer",
  description:
    "Full-stack developer portfolio — projects, blog, and interactive terminal.",
  keywords: [
    "full-stack developer",
    "react developer",
    "nextjs developer",
    "typescript developer",
    "web developer portfolio",
    "modern web development",
  ],
  openGraph: {
    title: "Dimas Saputra | Full-Stack Developer",
    description:
      "Full-stack developer portfolio — projects, blog, and interactive terminal.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dimas Saputra - Full-Stack Developer Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dimas Saputra | Full-Stack Developer",
    description:
      "Full-stack developer portfolio — projects, blog, and interactive terminal.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

/**
 * Root homepage Server Component rendering the main portfolio landing view.
 *
 * @description Assembles the landing page sections including Hero, About, Featured Projects,
 * Latest Blog Posts, and Interactive Terminal CTA within the standard page layout.
 * Also embeds JSON-LD structured schema data for Person and WebSite.
 *
 * @returns {JSX.Element} The rendered root homepage structure.
 */
export default function HomePage(): JSX.Element {
  const siteUrl = getSiteUrl();

  return (
    <StandardPageLayout>
      <HeroSection />

      <Suspense
        fallback={
          <LandingSectionSkeleton
            lines={4}
            heightClass="min-h-[200px]"
          />
        }
      >
        <AboutSection />
      </Suspense>

      <Suspense fallback={<FeaturedProjectsPhantomSkeleton />}>
        <FeaturedProjects />
      </Suspense>

      <Suspense fallback={<LatestPostsPhantomSkeleton />}>
        <LatestPosts />
      </Suspense>

      <TerminalCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Dimas Saputra",
            url: siteUrl,
            jobTitle: "Full-Stack Developer",
            description:
              "Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
            sameAs: [
              "https://github.com/infinitedim",
              "https://linkedin.com/in/infinitedim",
              "https://x.com/yourblooo",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Dimas Saputra Portfolio",
            url: siteUrl,
            description:
              "Full-stack developer portfolio — projects, blog, and interactive terminal.",
          }),
        }}
      />
    </StandardPageLayout>
  );
}

/**
 * Loading skeleton fallback component for the Featured Projects section.
 *
 * @description Renders pulsing placeholder project cards while project data is streamed
 * via React Suspense during server-side rendering.
 *
 * @returns {JSX.Element} The rendered featured projects skeleton placeholder.
 */
function FeaturedProjectsPhantomSkeleton(): JSX.Element {
  return (
    <section
      className="border-t border-(--terminal-border) px-4 py-16 cv-auto-section font-mono"
      aria-busy="true"
      aria-label="Loading featured projects"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="h-6 w-44 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="h-4 w-24 animate-pulse rounded bg-(--terminal-border)/50" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/80 p-4 space-y-4 overflow-hidden"
            >
              <div className="h-44 w-full animate-pulse rounded-md bg-(--terminal-border)/40" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-(--terminal-border)/70" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-full animate-pulse rounded bg-(--terminal-border)/50" />
                <div className="h-3.5 w-4/5 animate-pulse rounded bg-(--terminal-border)/50" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-5 w-16 animate-pulse rounded bg-(--terminal-border)/60" />
                <div className="h-5 w-20 animate-pulse rounded bg-(--terminal-border)/60" />
                <div className="h-5 w-14 animate-pulse rounded bg-(--terminal-border)/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Loading skeleton fallback component for the Latest Blog Posts section.
 *
 * @description Renders pulsing placeholder post items while blog articles are fetched
 * asynchronously and streamed via React Suspense.
 *
 * @returns {JSX.Element} The rendered latest posts skeleton placeholder.
 */
function LatestPostsPhantomSkeleton(): JSX.Element {
  return (
    <section
      className="border-t border-(--terminal-border) px-4 py-16 cv-auto-section font-mono"
      aria-busy="true"
      aria-label="Loading latest blog posts"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="h-6 w-48 animate-pulse rounded bg-(--terminal-border)/70" />
          <div className="h-4 w-24 animate-pulse rounded bg-(--terminal-border)/50" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/50 p-5 space-y-2.5 border-l-2 border-l-(--terminal-border)"
            >
              <div className="h-5 w-3/4 animate-pulse rounded bg-(--terminal-border)/70" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-(--terminal-border)/50" />
              <div className="h-3 w-40 animate-pulse rounded bg-(--terminal-border)/40" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
