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
    const base = slug ? `/blog/${slug}` : pathname === "/blog" ? "/blog" : pathname;
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-500">Language:</span>
      {BLOG_CONTENT_LOCALES.map((locale) => {
        const isActive = locale.code === activeLocale;
        return (
          <Link
            key={locale.code}
            href={buildHref(locale.code) as never}
            className={`rounded border px-2 py-0.5 text-xs transition-colors ${
              isActive
                ? "border-green-400/60 bg-green-400/10 text-green-400"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
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
