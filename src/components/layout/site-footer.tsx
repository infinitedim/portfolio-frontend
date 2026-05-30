import Link from "next/link";
import { Suspense, type JSX } from "react";
import { SOCIAL_LINKS } from "@/lib/data/social-links";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { NewsletterSignup } from "@/components/molecules/newsletter/newsletter-signup";
import { CopyrightYear } from "./copyright-year";

export function SiteFooter(): JSX.Element {
  const siteUrl = getSiteUrl();

  return (
    <footer
      aria-label="Site footer"
      className="border-t border-neutral-800 bg-neutral-950 px-4 py-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-neutral-400 transition-colors hover:text-green-400"
              >
                {link.platform}
                {link.handle ? ` (${link.handle})` : ""}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-neutral-800 pt-6">
          <p className="font-mono text-xs text-neutral-500">Newsletter</p>
          <NewsletterSignup />
        </div>

        <div className="flex items-center justify-center gap-4 font-mono text-xs text-neutral-500">
          <Link
            href="/rss.xml"
            className="transition-colors hover:text-orange-400"
          >
            RSS
          </Link>
          <span aria-hidden="true">·</span>
          <span>
            ©{" "}
            <Suspense fallback="2026">
              <CopyrightYear />
            </Suspense>{" "}
            Dimas Saputra
          </span>
        </div>
      </div>
      <p className="sr-only">{siteUrl}</p>
    </footer>
  );
}
