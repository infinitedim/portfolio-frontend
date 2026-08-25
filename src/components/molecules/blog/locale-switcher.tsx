"use client";

import { Suspense, useState, useRef, useEffect, type JSX } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import {
  BLOG_CONTENT_LOCALES,
  DEFAULT_BLOG_LOCALE,
  isValidBlogLocale,
} from "@/lib/i18n/locales";

/**
 * Properties for the BlogLocaleSwitcher component.
 *
 * @interface BlogLocaleSwitcherProps
 * @property {string} [slug] - Optional blog post slug to construct canonical localized post URLs.
 * @property {string} [className] - Optional container CSS class overrides.
 */
interface BlogLocaleSwitcherProps {
  slug?: string;
  className?: string;
}

/**
 * Internal interactive blog locale dropdown component.
 *
 * Reads active language parameters from search parameters, renders the language selection menu,
 * and manages click-outside and keyboard dismissal listeners.
 *
 * @param {BlogLocaleSwitcherProps} props - Component properties.
 * @param {string} [props.slug] - Optional post slug identifier.
 * @param {string} [props.className] - Container styling classes.
 * @returns {JSX.Element} The rendered locale switcher dropdown.
 */
function BlogLocaleSwitcherInner({
  slug,
  className = "",
}: BlogLocaleSwitcherProps): JSX.Element {
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

  /**
   * Constructs a localized URL preserving existing query search parameters.
   *
   * @param {string} locale - Target locale code (e.g., 'en', 'id').
   * @returns {string} The formatted destination URL string with query parameters.
   */
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
    /**
     * Closes the dropdown menu when clicking outside of the dropdown container.
     * @param {MouseEvent} event - The mouse click event.
     */
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    /**
     * Closes the dropdown menu when pressing the Escape key.
     * @param {KeyboardEvent} event - The keyboard press event.
     */
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
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
                  {isActive && <Check size={12} className="text-emerald-400" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Suspense-wrapped blog localization language switcher component.
 *
 * Provides terminal-styled language dropdown menu for switching between supported
 * blog article translation locales while preserving navigation context and query parameters.
 *
 * @param {BlogLocaleSwitcherProps} props - Component properties.
 * @param {string} [props.slug] - Optional blog post slug.
 * @param {string} [props.className] - Container CSS class names.
 * @returns {JSX.Element} The Suspense boundary enclosing BlogLocaleSwitcherInner.
 */
export function BlogLocaleSwitcher(props: BlogLocaleSwitcherProps): JSX.Element {
  return (
    <Suspense fallback={null}>
      <BlogLocaleSwitcherInner {...props} />
    </Suspense>
  );
}
