"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BLOG_CONTENT_LOCALES,
  DEFAULT_BLOG_LOCALE,
  isValidBlogLocale,
} from "@/lib/i18n/locales";

interface BlogLocaleSwitcherProps {
  slug?: string;
  className?: string;
}

function BlogLocaleSwitcherInner({
  slug,
  className = "",
}: BlogLocaleSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = searchParams.get("locale") ?? DEFAULT_BLOG_LOCALE;
  const activeLocale = isValidBlogLocale(currentLocale)
    ? currentLocale
    : DEFAULT_BLOG_LOCALE;

  const buildHref = (locale: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (locale === DEFAULT_BLOG_LOCALE) {
      params.delete("locale");
    } else {
      params.set("locale", locale);
    }
    const qs = params.toString();
    const base = slug
      ? `/blog/${slug}`
      : pathname === "/blog"
        ? "/blog"
        : pathname;
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 font-mono ${className}`}>
      <span className="text-xs text-terminal-muted">Language:</span>
      {BLOG_CONTENT_LOCALES.map((locale) => {
        const isActive = locale.code === activeLocale;
        return (
          <Link
            key={locale.code}
            href={buildHref(locale.code) as never}
            className={`rounded border px-2 py-0.5 text-xs transition-colors ${
              isActive
                ? "border-terminal-accent/60 bg-terminal-accent/10 text-terminal-accent"
                : "border-terminal-border text-terminal-muted hover:border-terminal-muted"
            }`}
            aria-current={isActive ? "true" : undefined}
          >
            {locale.flag} {locale.label}
          </Link>
        );
      })}
    </div>
  );
}

export function BlogLocaleSwitcher(props: BlogLocaleSwitcherProps) {
  return (
    <Suspense fallback={null}>
      <BlogLocaleSwitcherInner {...props} />
    </Suspense>
  );
}
