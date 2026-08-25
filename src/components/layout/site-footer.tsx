import Link from "next/link";
import type { Route } from "next";
import { Suspense, type JSX } from "react";
import { SOCIAL_LINKS } from "@/lib/data/social-links";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { NewsletterSignup } from "@/components/molecules/newsletter/newsletter-signup";
import { CopyrightYear } from "./copyright-year";
import { FooterResumeButton } from "@/components/molecules/shared/footer-resume-button";

export function SiteFooter(): JSX.Element {
  const siteUrl = getSiteUrl();

  const NAV_COMMANDS: { label: string; href: Route }[] = [
    { label: "$ cd /projects", href: "/projects" },
    { label: "$ cd /blog", href: "/blog" },
    { label: "$ cd /contact", href: "/contact" },
    { label: "$ cd /roadmap", href: "/roadmap" },
  ];

  return (
    <footer
      aria-label="Site footer"
      className="mt-12 sm:mt-16 border-t border-(--terminal-border) bg-(--terminal-bg)/90 px-4 pt-12 pb-8 transition-colors duration-300"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 font-mono">
        {/* Terminal Control Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6">
          {/* Col 1: Brand & Live Diagnostics (5 cols) */}
          <div className="flex flex-col gap-3.5 md:col-span-5">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-(--terminal-text)">
              <Link
                href="/"
                className="hover:text-(--terminal-accent) transition-colors"
              >
                infinitedim
              </Link>
              <span className="text-[10px] text-(--terminal-muted) font-mono">
                [NODE :: ASIA_SOUTHEAST2]
              </span>
            </div>

            <p className="text-xs text-(--terminal-muted) leading-relaxed max-w-sm">
              Systems & Fullstack Engineer. Building high-performance REST APIs
              with Rust & Axum, and edge-rendered UIs with Next.js 16.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-(--terminal-muted) bg-(--terminal-bg) border border-(--terminal-border) rounded-md px-3 py-1.5 w-fit">
              <span className="text-(--terminal-accent) font-bold">$</span>
              <span className="text-(--terminal-text)">status :: 200_OK</span>
              <span className="text-(--terminal-muted)">|</span>
              <span className="text-(--terminal-muted)">P95 &lt; 50ms</span>
            </div>
          </div>

          {/* Col 2: Terminal Nav & Socials (3 cols) */}
          <div className="flex flex-col gap-4 md:col-span-3">
            <p className="text-xs font-semibold text-(--terminal-accent) tracking-wider">
              $ ls --nav
            </p>

            <ul className="flex flex-col gap-1.5 text-xs text-(--terminal-muted)">
              {NAV_COMMANDS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-(--terminal-accent) transition-colors inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-2 flex flex-col gap-1.5">
              <p className="text-[11px] text-(--terminal-muted) font-medium">
                $ cat /socials
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--terminal-muted) transition-colors hover:text-(--terminal-accent)"
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Col 3: Newsletter Terminal Box (4 cols) */}
          <div className="flex flex-col gap-3 rounded-xl border border-(--terminal-border) bg-(--terminal-accent)/5 p-4 md:col-span-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-(--terminal-accent)">
                $ newsletter --subscribe
              </p>
              <span className="text-[10px] text-(--terminal-muted) uppercase tracking-widest font-sans">
                Monthly
              </span>
            </div>
            <p className="text-xs text-(--terminal-muted) leading-relaxed">
              Engineering logs on Rust systems, Next.js PPR, and GCP cloud
              architecture.
            </p>
            <NewsletterSignup />
          </div>
        </div>

        {/* Bottom Status & Copyright Strip */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-(--terminal-border)/80 pt-6 text-xs text-(--terminal-muted) sm:flex-row">
          <div className="flex items-center gap-3">
            <span>
              ©{" "}
              <Suspense fallback="2026">
                <CopyrightYear />
              </Suspense>{" "}
              Dimas Saputra
            </span>
            <span
              aria-hidden="true"
              className="text-(--terminal-muted)"
            >
              ·
            </span>
            <span className="text-(--terminal-muted)">All rights reserved</span>
          </div>

          <div className="flex items-center gap-3">
            <FooterResumeButton />
            <span
              aria-hidden="true"
              className="text-(--terminal-muted)"
            >
              ·
            </span>
            <Link
              href="/rss.xml"
              className="transition-colors hover:text-(--terminal-accent)"
            >
              $ cat /rss.xml
            </Link>
            <span
              aria-hidden="true"
              className="text-(--terminal-muted)"
            >
              ·
            </span>
            <span className="text-[11px] text-(--terminal-muted)">
              Next.js 16<span className="mx-1 text-(--terminal-border)">|</span>Axum 0.8<span className="mx-1 text-(--terminal-border)">|</span>GCP
            </span>
          </div>
        </div>
      </div>
      <p className="sr-only">{siteUrl}</p>
    </footer>
  );
}
