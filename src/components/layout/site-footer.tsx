import Link from "next/link";
import { type JSX } from "react";
import { SOCIAL_LINKS } from "@/lib/data/social-links";
import { getSiteUrl } from "@/lib/api/get-site-url";

export function SiteFooter(): JSX.Element {
  const siteUrl = getSiteUrl();
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label="Site footer"
      className="border-t border-neutral-800 bg-neutral-950 px-4 py-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
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

        <div className="flex items-center gap-4 font-mono text-xs text-neutral-500">
          <Link
            href="/rss.xml"
            className="transition-colors hover:text-orange-400"
          >
            RSS
          </Link>
          <span aria-hidden="true">·</span>
          <span>© {year} Dimas Saputra</span>
        </div>
      </div>
      <p className="sr-only">{siteUrl}</p>
    </footer>
  );
}
