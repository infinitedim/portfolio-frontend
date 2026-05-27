import { Metadata } from "next";
import { type JSX, Suspense } from "react";
import { HeroSection } from "@/components/organisms/landing/hero-section";
import { AboutSection } from "@/components/organisms/landing/about-section";
import { FeaturedProjects } from "@/components/organisms/landing/featured-projects";
import { SkillsGrid } from "@/components/organisms/landing/skills-grid";
import { LatestPosts } from "@/components/organisms/landing/latest-posts";
import { TerminalCta } from "@/components/organisms/landing/terminal-cta";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { getSiteUrl } from "@/lib/api/get-site-url";

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

export default function HomePage(): JSX.Element {
  const siteUrl = getSiteUrl();

  return (
    <StandardPageLayout>
      <HeroSection />

      <Suspense fallback={null}>
        <AboutSection />
      </Suspense>

      <Suspense fallback={null}>
        <FeaturedProjects />
      </Suspense>

      <Suspense fallback={null}>
        <SkillsGrid />
      </Suspense>

      <Suspense fallback={null}>
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
              "https://twitter.com/yourblooo",
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
