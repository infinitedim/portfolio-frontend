import { Metadata } from "next";
import { type JSX, Suspense } from "react";
import { HeroSection } from "@/components/organisms/landing/hero-section";
import { AboutSection } from "@/components/organisms/landing/about-section";
import { FeaturedProjects } from "@/components/organisms/landing/featured-projects";
import { LatestPosts } from "@/components/organisms/landing/latest-posts";
import { TerminalCta } from "@/components/organisms/landing/terminal-cta";
import { LandingSectionSkeleton } from "@/components/organisms/landing/landing-section-skeleton";
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
      <link
        rel="preload"
        as="image"
        href="/og-image.png"
      />
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

      <Suspense
        fallback={
          <LandingSectionSkeleton
            lines={6}
            heightClass="min-h-[320px]"
          />
        }
      >
        <FeaturedProjects />
      </Suspense>

      <Suspense
        fallback={
          <LandingSectionSkeleton
            lines={4}
            heightClass="min-h-[260px]"
          />
        }
      >
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
