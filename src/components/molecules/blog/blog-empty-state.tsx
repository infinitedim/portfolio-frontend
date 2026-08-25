import type { JSX } from "react";
import Link from "next/link";
import type { Route } from "next";

/**
 * Properties for the BlogEmptyState component.
 *
 * @interface BlogEmptyStateProps
 * @property {string} [search] - Active search query filter, if any.
 * @property {string} [tag] - Active tag filter, if any.
 * @property {string} [series] - Active series filter, if any.
 * @property {string} resetUrl - Target route URL to reset and clear all active filters.
 * @property {{ blogNoPostsFound: string; blogNoPostsMessage: string; blogViewAllPosts: string }} t - Localized dictionary strings for empty search and no-post messages.
 * @property {string} t.blogNoPostsFound - String template displayed when filtered query yields zero results.
 * @property {string} t.blogNoPostsMessage - General message displayed when the entire blog index has no articles.
 * @property {string} t.blogViewAllPosts - Button label text to view all articles.
 */
interface BlogEmptyStateProps {
  search?: string;
  tag?: string;
  series?: string;
  resetUrl: string;
  t: {
    blogNoPostsFound: string;
    blogNoPostsMessage: string;
    blogViewAllPosts: string;
  };
}

/**
 * Terminal-styled empty state view for the blog index and archive pages.
 *
 * Distinguishes between filtered zero-match queries (displaying active tags/terms and a `$ clear --filters` reset button)
 * and globally empty blog archives (displaying CLI navigation prompts `$ cd /projects`, `$ cat /about`, `$ send --message`).
 *
 * @param {BlogEmptyStateProps} props - Component properties.
 * @param {string} [props.search] - Filter search keyword.
 * @param {string} [props.tag] - Filter tag name.
 * @param {string} [props.series] - Filter series slug.
 * @param {string} props.resetUrl - Navigation URL to clear all filters.
 * @param {object} props.t - Localized translation strings.
 * @returns {JSX.Element} The rendered empty state container.
 */
export function BlogEmptyState({
  search,
  tag,
  series,
  resetUrl,
  t,
}: BlogEmptyStateProps): JSX.Element {
  const isFiltered = Boolean(search || tag || series);

  return (
    <div className="relative rounded-2xl border border-(--terminal-border) bg-(--terminal-bg)/60 p-8 sm:p-14 text-center backdrop-blur-md overflow-hidden my-8 shadow-2xl">
                             
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-(--terminal-accent)/0 via-(--terminal-accent) to-(--terminal-accent)/0" />

                                    
      <div className="absolute inset-0 bg-[radial-gradient(var(--terminal-accent)_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.03] pointer-events-none" />
      {isFiltered ? (
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-xl font-bold font-mono text-(--terminal-text)">
            $ grep --result=0
          </h3>
          <p className="text-(--terminal-muted) text-sm sm:text-base leading-relaxed font-mono">
            {t.blogNoPostsFound}{" "}
            {search && (
              <span className="text-(--terminal-text) font-semibold">
                &ldquo;{search}&rdquo;
              </span>
            )}
            {search && (tag || series) && " in "}
            {tag && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-(--terminal-accent)/10 text-(--terminal-accent) border border-(--terminal-accent)/20 text-xs font-mono ml-1">
                #{tag}
              </span>
            )}
            {tag && series && " in "}
            {series && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-(--terminal-accent)/10 text-(--terminal-accent) border border-(--terminal-accent)/20 text-xs font-mono ml-1">
                series:{series}
              </span>
            )}
          </p>
          <div className="pt-2">
            <Link
              href={resetUrl as Route}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-(--terminal-accent) text-(--terminal-bg) font-mono text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              <span>$ clear --filters</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-5">
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-(--terminal-text) tracking-tight">
            $ cat /dev/null &gt; articles.log
          </h3>
          <p className="text-(--terminal-muted) text-sm sm:text-base leading-relaxed">
            {t.blogNoPostsMessage}
          </p>
          <p className="text-(--terminal-muted) opacity-80 text-xs sm:text-sm font-mono">
            Technical deep-dives, Rust/Axum architecture breakdowns, and Next.js
            16 engineering notes are currently being prepared in draft stage.
          </p>

                                                 
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-(--terminal-accent) text-(--terminal-bg) font-mono text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              <span>$ cd /projects</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/60 hover:border-(--terminal-accent)/50 text-(--terminal-text) font-mono text-sm transition-colors"
            >
              <span>$ cat /about</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/60 hover:border-(--terminal-accent)/50 text-(--terminal-text) font-mono text-sm transition-colors"
            >
              <span>$ send --message</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
