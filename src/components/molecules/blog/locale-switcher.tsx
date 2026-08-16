"use client";

import { Suspense, useState, useRef, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = searchParams.get("locale") ?? DEFAULT_BLOG_LOCALE;
  const activeLocale = isValidBlogLocale(currentLocale)
    ? currentLocale
    : DEFAULT_BLOG_LOCALE;

  const currentConfig =
    BLOG_CONTENT_LOCALES.find((l) => l.code === activeLocale) ??
    BLOG_CONTENT_LOCALES[0];

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block font-mono text-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/90 px-3 py-1.5 text-(--terminal-text) hover:border-(--terminal-accent)/50 hover:text-(--terminal-accent) focus:outline-none focus:ring-1 focus:ring-(--terminal-accent)/50 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
        aria-label="Select blog language"
      >
        <span className="text-(--terminal-accent) font-bold">$ lang</span>
        <span className="text-(--terminal-muted)">--select</span>
        <span className="flex items-center gap-1.5 text-(--terminal-text)">
          <span>{currentConfig.flag}</span>
          <span className="font-medium">{currentConfig.label}</span>
        </span>
        <span className="text-(--terminal-muted) text-[10px]">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div
          data-lenis-prevent
          data-lenis-prevent-wheel
          className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 z-40 w-56 rounded-xl border border-(--terminal-border) bg-(--terminal-bg)/95 py-1.5 shadow-2xl backdrop-blur-md overscroll-contain"
        >
          <div className="px-3 py-1 text-[10px] text-(--terminal-muted) uppercase tracking-wider font-semibold border-b border-(--terminal-border)/80 mb-1">
            Available Locales ({BLOG_CONTENT_LOCALES.length})
          </div>
          <div
            data-lenis-prevent
            data-lenis-prevent-wheel
            className="max-h-60 overflow-y-auto py-0.5 overscroll-contain"
          >
            {BLOG_CONTENT_LOCALES.map((locale) => {
              const isActive = locale.code === activeLocale;
              return (
                <Link
                  key={locale.code}
                  href={buildHref(locale.code) as never}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                      : "text-neutral-300 hover:bg-neutral-800/80 hover:text-emerald-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{locale.flag}</span>
                    <span>{locale.label}</span>
                  </span>
                  {isActive && <span className="text-emerald-400">✓</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
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
