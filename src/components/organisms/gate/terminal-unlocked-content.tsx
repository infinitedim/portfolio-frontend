import { StaticContent } from "@/components/organisms/shared/static-content";
import { type JSX, Suspense } from "react";
import { TerminalLoadingProgress } from "@/components/molecules/terminal/terminal-loading-progress";
import { HomeTerminalHeader } from "@/components/molecules/shared/home-terminal-header";
import { TerminalClient } from "@/components/layout/terminal-client";

export function TerminalUnlockedContent(): JSX.Element {
  return (
    <>
      <div className="sr-only">
        <h1>Terminal Portfolio - Full-Stack Developer</h1>
        <p>
          Interactive developer portfolio showcasing React, Next.js, TypeScript,
          and modern web development projects.
        </p>
        <nav>
          <ul>
            <li>
              <a href="/projects">Projects</a>
            </li>
            <li>
              <a href="/skills">Skills</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </nav>
      </div>

      <main
        id="main-content"
        className="relative"
      >
        <HomeTerminalHeader />
        <StaticContent />
        <Suspense
          fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
              <TerminalLoadingProgress />
            </div>
          }
        >
          <TerminalClient />
        </Suspense>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Terminal Portfolio",
            description:
              "Interactive developer portfolio with terminal interface",
            url: "https://infinitedim.dev/terminal",
            mainEntity: {
              "@type": "Person",
              name: "Dimas Saputra",
              jobTitle: "Full-Stack Developer",
              description:
                "Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://infinitedim.dev",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Terminal",
                  item: "https://infinitedim.dev/terminal",
                },
              ],
            },
          }),
        }}
      />
    </>
  );
}
