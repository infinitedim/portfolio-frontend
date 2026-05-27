"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { LanguageSwitcher } from "@/components/molecules/shared/language-switcher";

const NAV_LINKS = [
  { key: "navHome" as const, href: "/" },
  { key: "navProjects" as const, href: "/projects" },
  { key: "navBlog" as const, href: "/blog" },
  { key: "navContact" as const, href: "/contact" },
  { key: "navRoadmap" as const, href: "/roadmap" },
] as const;

interface SiteNavProps {
  currentPath?: string;
}

export function SiteNav({ currentPath }: SiteNavProps): JSX.Element {
  const pathname = usePathname();
  const activePath = currentPath ?? pathname;
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link
          href="/"
          className="font-mono text-sm font-bold text-green-400 hover:text-green-300"
        >
          infinitedim
        </Link>

        <ul className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map(({ key, href }) => {
            const isActive =
              href === "/"
                ? activePath === "/"
                : activePath.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`rounded px-3 py-1.5 font-mono text-xs transition-colors ${
                    isActive
                      ? "bg-green-400/10 text-green-400"
                      : "text-neutral-400 hover:text-neutral-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            variant="dropdown"
            showFlags={false}
            className="hidden sm:block"
          />
          <Link
            href="/gate"
            className="rounded border border-green-400/40 bg-green-400/10 px-3 py-1.5 font-mono text-xs text-green-400 transition-colors hover:bg-green-400/20"
          >
            {t("navTerminal")} →
          </Link>
        </div>
      </nav>
    </header>
  );
}
